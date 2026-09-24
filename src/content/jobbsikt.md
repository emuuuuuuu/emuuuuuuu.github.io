# Natural language guided job search

Matches frontier-LLM picks at 1/80 of the cost

![](/article/jobbsikt/query-box.png)

Most job boards' recommendations suffer from the same problem. A search for a title returns an overwhelming number of results, most of which are obviously irrelevant from the title alone. Or you click something promising, only to find you're not even qualified to apply. The nuances of what the user is after are too fine-grained to fit into a primitive search query.

The obvious fix is vector search on the user's CV, either by comparing the embedded CV directly to embedded listings or by using [HyDE (Hypothetical Document Embeddings)](https://arxiv.org/abs/2212.10496). To avoid missing hidden gems, this search needs a wide beam, and a wide beam inevitably catches irrelevant listings which are tedious to sift through.

This filtering problem is exactly what cross-encoder rerankers are for. They score listings by semantic relevance to the resume and are cheap to run, but their reading comprehension is limited. They struggle with negation, they're biased by document length, and they score each document independently, so comparative reordering isn't possible.

This is where LLMs come in. [RankGPT](https://arxiv.org/abs/2304.09542) showed their potential in 2023, but at a significant cost in price and latency. The frontier model at the time, GPT-4, cost $52.5 per 1 million output tokens, while a model of equivalent performance today, Granite-4.1-8B, costs $0.09. 

Some job boards have started integrating LLMs. Finn.no offers LLM scoring, but the user has to trigger it manually per listing, so the job has already been found by the user, they didn't get any help with the search. Finn.no also has "SmartSøk," which combines semantic search with an LLM. To keep latency and cost down, though, it either searches too narrowly or uses an LLM too weak to produce good results. It also shows only a few listings at a time, which leaves the user without a sense of oversight: no confidence that there isn't a dream listing out there that they missed.

## Jobbsikt

Jobbsikt has the user provide their resume and a natural language query optionally describing location preferences etc. We do a wide search of 200 listings, and rank them almost exactly as Claude Fable 5.1 would, all in about 10 seconds, and for about $0.03 per search. The result gives you a ranked and scored overview of all listings.

```video
/article/jobbsikt/demo.mp4
```

Based on the CV and user query, we have an LLM generate a fictive listing in the style of Norwegian job boards. We generate 3 in Norwegian and 3 in English both with temperature = 0.7, embed them, and take the average to reduce variance. Before we do the vector search, we extract any location preferences from the user query, which we use for a WHERE clause to restrict the search within those preferences, because location is almost always a hard filter, not a soft one for the LLM to judge, and it is one of the cheapest levers to increase recall. We then do a vector search on the 10000+ real listings we have fetched from [NAV](https://arbeidsplassen.no) and embedded. We grab the top 200 candidate listings, then rerank them batchwise with [Jev](https://docs.typesafe.ai/introduction), a general-purpose classifier. To reduce cost, this reranking step does not judge the original listings, but a compressed summary which we compute at ingest time to reduce token cost by stripping the listings of corporate boilerplate and redundant information. This reranking returns scores for each listing on a grading scale we've specified in its instruction.

## Search examples

**CV: 19-year-old straight out of high school, no work experience.**

> I'm a bit introverted, so I'd rather not work in a shop.

![](/article/jobbsikt/example-school-leaver.png)

---

**CV: Nurse with 8 years of experience**

> I've grown tired of being on the floor, I'd like something more administrative.

![](/article/jobbsikt/example-nurse.png)

## Evaluation

Evaluating this pipeline by making a hand-labeled dataset of 10000+ scored listings for a handful of CV and user query variations is intractable, there are too many cases, and it's slightly subjective what makes a suggestion good. But with the current quality of frontier LLMs, we can use the gradings of models such as Claude Fable 5.1, as a comparative ground truth dataset which we evaluate cheaper models on in our local evaluation harness. 

Technical detail: Allowing models to reason helps grading substantially, and although it doesn't actually cost that much more since most of our costs go to input tokens, it is substantially slower at sometimes 10x the waiting time, which is impractical for a service presented as search, we have therefore only experimented with non-reasoning models, excluding Jev, which is not even an LLM.

Every metric below is measured against Fable's grading of the same listings:

- **nDCG@10** — how closely the top 10 matches Fable's ordering, weighted so the highest positions count for most.
- **best F1** — the best balance of precision and recall the model can reach on "worth applying to", at whatever threshold suits it.
- **Spearman** — rank correlation across all 200 listings, not just the top of the list.
- **false+** — listings the model puts above the threshold that Fable puts below. The bad apples the user would actually see.

![](/article/jobbsikt/grader-benchmark.png)

![](/article/jobbsikt/cost-latency.png)

Running those same 200 listings through Fable would mean 200 listings at roughly 1,180 tokens each, or about 236,000 input tokens at $10 per million = $2.36 a search before output, against $0.03 for the entire Jobbsikt pipeline, or about 1/80.

Most of the models we've experimented with, despite having reasoning turned off, are surprisingly good at agreeing with Fable on the top 10 listings, with all models agreeing >78% of the time on average. But a notable difference is how selective the frontier models are about which listings score above the threshold of being worth applying to (which per the grading scale is 0.5) relative to the cheaper LLMs. This selectivity is important, because if a few obviously bad apples get shown, the user will start to doubt the results altogether. However, this overeagerness to score mediocre listings above the threshold does not apply to Jev, which returns almost no false positives relative to the ground truth, and it is very fast. Jev's lower Spearman score is mostly due to it being even stricter than Fable about hard qualification requirements when ranking.

## Conclusion

Using Fable as a judge is not an exact science, but it's the best choice available to get human-like grading at scale, which is necessary for big and nuanced data like this. Models have gotten good enough that telling really good from insanely good apart has stopped mattering. Whether the 7th listing should actually be the 8th on the results list, is not all that relevant to the user, as long as they can be confident that they're shown what they asked for. But whether a listing they're obviously not qualified for shows up at all, is something they notice immediately, and that is what Jev gets right, at 1/80 of the cost.

---

*Jobbsikt was built by Vebjørn Haug Kåsene and Emil Ekelund.*