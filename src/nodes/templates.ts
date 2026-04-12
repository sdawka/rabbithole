export const defaultTemplates: Record<string, string> = {
  topic_entry: `The user has chosen a rabbit hole topic to explore.

Topic: {{user_input}}

In 3-5 sentences, capture what makes this topic fascinating and list 3-4 intriguing angles worth investigating. Be concise and curious.`,

  brain_dump: `Topic: {{topic}}
{{#user_input}}
The user already knows: {{user_input}}
{{/user_input}}

Write a quick brain dump: key facts, common misconceptions, and interesting starting points about this topic. Use short bullet points. Keep it under 150 words.`,

  research_questions: `Topic: {{topic}}

Known so far: {{knowledge_dump}}

Generate 5-6 sharp research questions — surprising angles, hidden history, who benefits, what's misunderstood. Numbered list, one line each.`,

  source_discovery: `Based on the topic "{{topic}}" and these research questions:
{{questions}}

Generate 5-8 specific search queries designed to find the BEST content to consume on this topic. Mix these types:
- YouTube video essays, documentaries, or explainers (include "youtube" in query)
- Long-form articles, deep dives, or investigative journalism
- Podcast episodes (include "podcast" in query)
- Reddit threads or forum discussions with real expertise
- Academic or expert perspectives that are accessible

Make queries specific enough to find hidden gems, not just the first page of Google. Return ONLY the search queries, one per line.`,

  source_analysis: `Analyzing sources for rabbit hole on "{{topic}}".

Source content:
{{source_content}}

For each source, provide:
- **Key insight** (1-2 sentences)
- **Surprise** (one unexpected finding)
- **New question** (one follow-up)

Be specific. Keep each source's analysis to 3-4 lines.

---

**RECOMMENDED CONTENT**
Based on what these sources reference, mention, or link to, list any specific:
- YouTube videos or channels worth watching
- Articles, books, or papers worth reading
- Podcasts or interviews worth listening to
- Documentaries or films to check out
Include the creator/author name and why it's worth consuming. Only include things actually referenced in the sources — don't make them up.`,

  emerging_questions: `Topic: {{topic}}

Raw questions from sources:
{{new_questions}}

Deduplicate and prioritize. Return the top 5-6 most interesting questions as a numbered list. One line each — no explanations needed.`,

  aha_moments: `Topic: {{topic}}

Insights: {{insights}}

Pick the 3-4 most surprising or paradigm-shifting findings. For each, one bold label and 1-2 sentences. Format:
- **[Label]**: [What and why it's surprising]`,

  key_concepts: `Topic: {{topic}}

Insights: {{insights}}

List the 4-6 most important concepts or terms. For each: **[Term]** — one-sentence definition. Keep it tight.`,

  key_people: `Topic: {{topic}}

Insights: {{insights}}

List 3-5 key people. For each: **[Name]** ([role]) — one sentence on why they matter. Include non-obvious picks.

Then add:

**WORTH FOLLOWING**
For each person, if they have any of these, list them:
- YouTube channel or notable video
- Podcast or interview appearance
- Blog, newsletter, or Twitter/X account
- Book or paper that's a good entry point
Only include what you're confident exists. One line per person.`,

  pattern_recognition: `Topic: {{topic}}

Insights: {{insights}}

Concepts: {{concepts}}

Identify 3-4 recurring patterns or themes. For each: **[Pattern]** — 2-3 sentences on what recurs and why it matters. Note one key disagreement between sources if any.`,

  synthesis: `You are creating a synthesis of a rabbit hole exploration.

Topic: {{topic}}

Patterns found:
{{patterns}}

Key insights:
{{aha_findings}}

Key concepts:
{{concepts}}

Key people:
{{people}}

Create a compelling synthesis that tells the story of this rabbit hole. Include:

**THE BIG PICTURE** — What is the most important thing to understand about this topic? (2-3 sentences)

**TOP 3 TAKEAWAYS**
1. [Most important learning]
2. [Most surprising discovery]
3. [Most useful connection]

**HOW THIS CONNECTS** — How does this topic connect to broader themes or other fields?

**THE RABBIT HOLE GOES DEEPER** — What's the next level of exploration if someone wants to go further?

**CONTENT TO CONSUME**
Compile the best content recommendations from earlier in the exploration into a curated list:
- **Watch**: Best 2-3 YouTube videos or documentaries
- **Read**: Best 2-3 articles, books, or threads
- **Listen**: Best 1-2 podcasts or interviews
- **Follow**: Best 1-2 people/channels for ongoing content
For each, include the title/creator and one line on why it's worth your time. Only include things that were actually discovered during this research.`,

  reflection: `You are helping someone reflect on their rabbit hole exploration journey.

Topic: {{topic}}

Summary of findings:
{{summary}}
{{#user_input}}

User's personal reflections:
{{user_input}}
{{/user_input}}

Help them reflect on this exploration:

**THINKING SHIFT** — How has understanding of this topic changed from start to finish?

**STILL MYSTERIOUS** — What remains genuinely unclear or debated?

**SEEDS PLANTED** — What 2-3 new rabbit holes has this exploration opened up? (topics that deserve their own deep dive)

**THE ONE-LINER** — If you had to explain this entire rabbit hole to a friend in one sentence, what would it be?

Be honest about what's still unknown — that's part of the fun.`,
};
