The following prompt is my transcribed rambling about my needs for a budgeting app.

"I want a personal finance and budget tool. I'm gonna use it only on my own on a Windows 11 machine, and I want to use it to plan my budget, basically. So I'm gonna give it the expenses I have via CSV file from my bank, and I want it to categorize the output the way I put money out into certain categories, and from the analysis of the past, I want it to build budgets for future expenses, so I can plan how much money is leaving my bank account most likely. And then my income is not a steady stream, my income is basically whenever I have customers. So I also want all the incomes to be mapped and potential income, so customers that already said yes but haven't paid yet should also be tracked. And I want a zero money day projection. I want to know when I'm running out of money with all the cost that I definitely have, plus the average cost of the usual spendings I have as well as projected costs from already known things I need to pay like taxes or other things that we know will come in the future. So there should be a definitive zero money day given the known income and the known output, and there should be a potential zero money day given the project possible incomes if they pay, which are never guaranteed, of course."

Claude's reaction:
"What I'm hearing:
  - Single user, single machine, personal tool. No collaboration, no multi-tenant.
  - The centerpiece is the "zero money day" — not the budget itself, but the projection. The budget is in service of that.
  - There are at least four flavors of money flow: confirmed past (CSV), confirmed future (taxes, known bills), probable future (averaged from history), and possible future
  (customer pipeline). The genius of the tool is treating those distinctly rather than mashing them together.
  - Two parallel projections: pessimistic (only confirmed) and optimistic (with possibles). I'd guess the gap between those two dates is itself the most interesting number on the
  screen.
  Now the part I want to push on, because it's where your situation is unusual:
  The customer income pipeline. You said "customers that already said yes but haven't paid yet." That phrase implies there are states a potential income passes through before it
  becomes real money in the bank. Walk me through one. Pick a real-ish example — a customer you might have right now or recently had — and tell me the lifecycle:
  - When does it first show up in your awareness as a possible income?
  - What has to happen for it to graduate from "lead" to "yes but unpaid" to "paid"?
  - Are there in-between states you actually distinguish in your head — "verbal yes", "contract signed", "invoiced", "overdue"?
  - And: do you ever count partial confidence? ("70% likely they'll close")
  The reason I'm digging here: the quality of your zero-money-day projection depends entirely on how you model uncertainty in income. Mash it all into one bucket and the
  optimistic date is fantasy; model it too granularly and you'll never enter the data."


My follow up response:
"I do not care about leads and closing times, I only care about customers that confirmed a contract, and then there is a projected income to a certain date, but since it hasn't been paid yet, we don't know if the money arrives. It most likely will, but not always guaranteed."


Claudes follow up:
"Quick check on terminology before I move on: when you said "definitive zero money day given the known income," does "known" mean paid only, or paid + contracted? My read is
  paid-only (otherwise the optimistic/pessimistic split collapses), but I want to be sure I have your line in the right place.

  Now the mirror question — the expense side.

  I'm hearing three flavors of expense in what you said:

  1. Past expenses — what already left the bank (CSV)
  2. Known future expenses — taxes, fixed bills, things you can put a date and amount on
  3. Probable future expenses — averaged from history within a category (groceries, gas, etc.)

  Is that the full set, or is there a fourth I'm missing?

  And specifically: do expenses ever have the same "contracted but not paid" state that income has? Like — you've signed up for a thing, it'll bill you, but it hasn't hit yet. Or
  do those just collapse into category #2 (known future) the moment you know about them?

  The reason I'm asking: if expenses have the same uncertainty states as income, then the model is symmetric and clean. If they don't, the asymmetry is meaningful and we should
  name why."


My follow up response:
"The differentiation in the outcome would be there is subscriptions which are definite costs coming in the future. This starts from pay my rent to paying my clot code subscription. And then there is the average of spendings on food, groceries, etc."


Claude found asymmetry and refined ubiquituos language already:
"Got it. So the expense side has a different kind of split than the income side:       
                                                                                                                                                                                   
  - Income splits by certainty: contracted vs paid                                                                                                                                 
  - Expense splits by predictability: recurring fixed (rent, Claude subscription) vs averaged variable (food, groceries)                                                           
                                                                                                                                                                                   
  That asymmetry is real and worth keeping. Income uncertainty is "will it happen?" Expense uncertainty is "how much, when?" Different problems, different models.
                                                             
  One small placement question before I move on: taxes. You mentioned them earlier as "things we know will come in the future." Are those a subscription-with-yearly-cadence
  (predictable date and amount, just rare), or do they live in a third bucket — large irregular known obligations? My instinct says they're just subscriptions with a long cadence,
   but you might think of them differently. I'll defer to you.

  Now the bigger question, because this is where the actual work of using the tool lives:

  The categorization workflow. When the CSV lands on disk, what happens?

  You said "the way I put money out into certain categories" — which sounds like you define the categories and you assign rows to them. Concretely:

  - Do you want to look at every row once and tag it, then never see it again?
  - Do you want rules that auto-tag based on the description ("anything from REWE → groceries", "anything from Vodafone → utilities")?
  - Do you want the tool to learn from past tagging and propose categories for new rows?
  - Are categories flat ("groceries", "rent", "fun") or hierarchical ("essentials → groceries → REWE")?

  And one related question: when a recurring subscription (rent, Claude) shows up in the CSV, is it already pre-classified by you (because you told the system "rent = €1200/mo,
  paid on the 1st"), or does it just appear as another row that needs tagging like any other?

  The reason I'm digging here: this is the only place in the tool where you actually do manual labor every month. If it's painful, the projection rots. If it's frictionless, the
  rest works."


  My responce:
  "Taxes are not the same as a subscription. I have a quarterly prepayment for my income tax that depends on last year's calculations. It's basically a fixed sum that the finance department gives me. And no matter how much money I'll make, the projection from last year determines how much I have to pay. And at the end of the year there will be the actual calculation and then there the difference will be either rewarded or I still have to pay that. This will then change next year's prepayments amount. 
  The categorization I would like as much automation as possible. I should be able to take any row in the CSV or any importe and re-categorize it, but the categorization should work with automatic detection as much as as possible. A recurring thing like rent should be already after the initial categorization should be already categorized. and the categories are not flat, they are hierarchical. I want to have a Sanky diagram in the end that shows me income versus expenses."


  Claudes responce:
  "  1. Quick confirm I had right earlier: "definitive zero day" uses paid income only — contracted-but-unpaid income counts only toward the optimistic projection. Right?

  2. Where does the projection start from? The math needs a current bank balance. Is that:
  - the running balance derived from the latest CSV row, or
  - a number you maintain separately (so the tool doesn't have to trust CSV completeness)?

  3. Where does the projection end? Options I see:
  - Rolling 12 months
  - End of current calendar year
  - Walks forward until either projected balance hits zero (whichever comes first)
  - All of the above, you pick the lens

  4. Headline question — what do you open the tool to see first? Is it:
  - The zero-day number (panic indicator: "you have until Sept 14")
  - The Sankey (situational awareness: "where is my money going?")
  - Both, equally

  This determines what v1 has to nail vs. what can come later."


  My responce:
  "1: Correct. 2: There will be an initial value. 3: All of the above I pick the lens. 4: Both equally."


  Cloud code.
  "Good — that locks the math:                                                                                                                                                      
                                                                                                                                                                                 
  - Pessimistic projection: starting balance + paid income going forward + all known expenses (subscriptions, taxes, averaged variables)                                           
  - Optimistic projection: same, plus contracted-but-unpaid income at expected dates                                                                                             
  - Time horizons are user-selected (12 months / EOY / until-zero)                                                                                                                 
  - v1 has to ship both the zero-day number and the Sankey as first-class views         
                                                             
  I think I'm one round of questions away from being able to draft. Two things left:

  Success picture for v1. Imagine you sit down with the tool a month from now, with your real CSV imported and your subscriptions/taxes/contracts entered. What does "this is
  working, it was worth building" look like? Pick one or two concrete moments:

  - Is it that you can answer "can I afford to take June off?" in 30 seconds?
  - Is it that you stop having that vague background dread about cash flow because the number is just there?
  - Is it that the Sankey shows you a category bleeding money you didn't notice?
  - Something else?

  Non-goals — let me propose, you strike or keep. Here's my read of what this tool is not:

  - ❌ No lead/sales tracking — only confirmed contracts count
  - ❌ No probability scoring on income — binary contracted vs paid
  - ❌ No multi-user, no cloud sync, no telemetry — local Windows tool, your data stays on your machine
  - ❌ No investment / asset tracking — this is cash-flow only, not net worth
  - ❌ No goal-based saving ("save €X by date Y") — the tool tells you when you'll run out, not when you'll hit a target
  - ❌ No debt schedule beyond what shows up as a recurring expense — no loan amortisation engine
  - ❌ No mobile companion, no notifications, no scheduled reports — you open it when you want to look

  Which of those should stay non-goals? Are any of them actually goals you do want? And is there anything I should add to the list — something you can imagine someone (or
  future-you) being tempted to bolt on, that you want to rule out now?"


  My response:
  "Success for me is knowing where I'm bleeding money that I didn't notice And figuring out how I can make my money last longer. Non goals are all Correct."


  Lord, final response:
  "All written. Here's what's now on disk under .agenthoff/:

  vision.md                              ← read this first                                                                                                                         
  context-map.md                         ← four BCs + relationships
  contexts/                                                                                                                                                                        
    cash-inflow/README.md                (core)                                         
    cash-outflow/README.md               (supporting; hosts categorization)
    tax-obligations/README.md            (core)
    forecasting/README.md                (core; zero-day + Sankey)
  knowledge/
    decisions/
      0001-local-only-personal-tool.md
      0002-binary-income-states.md
      0003-two-projection-model.md
    protocol.md

  Three open questions are tracked in vision.md — none block starting:

  - Bank CSV format(s) supported in v1
  - What happens to a contracted income that passes its expected date unpaid
  - How the annual tax reconciliation is captured (manual single event vs. modelled)

  When you want to go a level deeper, /agenthoff:model on any specific BC will work out aggregates / events / commands inside it. /agenthoff:work only kicks in once there are
  refined todos to execute."