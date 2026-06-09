---
author: "Sarthak Makhija"
title: "When the Code Runs but Your Body Crashes: Re-evaluating Boundaries Under Crazy Timelines"
description: "A personal story of a long pairing day, a midnight hospital run, and why we must prioritize biological constraints over artificial deadlines."
pubDate: 2026-06-09
draft: true
tags: ["Developer Health", "Software Craftsmanship", "Personal Reflection"]
---

Yesterday (June 8th 2026) began like any other intense day of pairing. My colleague and I were in the trenches, working on a complex experiment: building a transpiler from **UniBasic** to structured, modern **Java**. 

We were deep in the integration phase, trying to fit the newly generated Java code back into our end-to-end execution flow. When you are writing a transpiler, the problem space is incredibly dense. But the real complexity starts during integration: you are bridging two completely different worlds, the legacy UniBasic execution flow and the new Java execution flow. When an error occurs, tracking it down is incredibly difficult because you have to debug and cross-reference both environments to find the root cause. This debugging loop demands long, exhausting hours of continuous pairing. Because of the crazy project timelines, the pressure to make this end-to-end integration work was intense.

We paired all day, trying to maintain a high-intensity focus. Around 7\:50 PM, we finally decided to close our editors. The code compiled, the integration worked, and the day's sprint was technically a success. 

I shut my laptop, feeling the familiar exhaustion of a day's work, but reassured by the fact that I was doing \"decent\" in life. I climb stairs, I do yoga daily, and I maintain my health. 

But my body had a different plan.

---

### The Timeline: 8\:15 PM to 10\:30 PM

At 8\:15 PM, I stepped onto my yoga mat for a scheduled 1-hour session. I expected the quiet stretching and breathing exercises to act as a system flush, a quick decompression sequence to wash away the stress of the day.

Instead, I felt immediately uncomfortable. By the end of the session, a dull pain settled into my chest. I tried to write it off: *It's just bone pain, a minor strain from yoga.* I had dinner, hoping a bit of rest would resolve it.

But around 10\:30 PM, a new symptom arrived: my left arm began to feel heavy. 

In the tech world, we are trained to identify anomalies and debug them before they trigger system failures. A heavy left arm and chest pain are the highest-severity alerts a human body can throw. We decided not to wait. We got into the car and drove to the hospital.

---

### The Diagnostics: Searching for the Bug

By midnight, I was sitting in a room, hooked up to an ECG and ECHO.

The medical team ran the standard diagnostic suite for a high-priority incident:

* **ECG:** Normal.
* **ECHO:** Normal.
* **Blood Tests:** Normal.

The physical machinery of my heart was fine. But the system metrics were highly elevated: both my heart rate and my blood pressure were significantly above normal. 

The doctor looked at the charts, looked at me, and delivered a simple diagnosis: *it was mostly anxiety.*

Then, he gave me a piece of advice that felt completely counter-intuitive:
> **\"Do cardio, and drop the yoga for now.\"**

It was in that quiet moment in the hospital room that the pieces started coming together. A single day's intense effort doesn't trigger a physiological crash on its own. What I began to realize was that this wasn't a one-day problem. It was the cumulative effect of weeks of sustained pressure, endless context-switching, and carrying the complex weight of transpiler architecture in my head day after day. You think you are successfully buffering the stress, but the physiological debt accumulates quietly in the background.

And that night, my body decided it was time to collect.

---

### The Paradox: Yoga vs. Cardio

*(Disclaimer: I am not a doctor, and this is not medical advice. I am simply reflecting on the advice my doctor gave me for my specific physiological response to stress.)*

Why would a doctor tell a stressed-out developer to stop doing yoga and start running on a treadmill or walking for 5 KMs?

In my case, it was about how my body was processing fight-or-flight hormones. When you work under intense, long-duration mental strain, your body gets flooded with cortisol and adrenaline. 

Yoga is a quiet, introspective discipline. When I stepped onto a yoga mat with a nervous system saturated with stress hormones, the quietness forced me to sit silently with my thoughts and internal tension. Without a dynamic physical outlet, my mind began to loop, and the anxiety spiraled (mostly). 

For my specific state of anxiety and higher HR, the doctor suggested cardio because it acted like a physical release valve. Running or cycling gives the body a mechanical reason to pump blood, sweat, and burn off that built-up adrenaline. For me, it was a reminder that wellness isn't a one-size-fits-all formula, and sometimes the body needs active movement rather than forced stillness to reset.

---

### Three Hard-Hitting Realities of Overwork

This hospital visit was a loud wake-up call. It forced me to look at the boundaries I had set between my life and my work, and realize that my current mental model was fundamentally broken.

Here are the key takeaways from that night:

#### 1. You cannot \"out-yoga\" a stressful work pace
Many of us treat exercise or wellness routines as a shield. We think: *\"As long as I run, eat clean, or do my daily yoga, I can work 9-10 hour high-intensity days under crazy timelines.\"* 

This is a dangerous illusion. Wellness habits are not a license to overwork. If your day-to-day work environment is too intense, a 1-hour yoga session cannot physically undo the physiological toll of a 9-10 hour high-pressure pairing session, especially when that toll is cumulative, compounding week after week. You cannot out-exercise a lifestyle that is actively wearing you down.

#### 2. Quiet mindfulness isn't always the cure for high-adrenaline stress
We are often told to sit quietly, meditate, and breathe when stressed. But I realized that when you are in the middle of a high-adrenaline project phase, forced stillness can sometimes leave you trapped with your own racing thoughts and internal physical tension. For some types of stress, especially the high-adrenaline, timeline-driven kind, the body might need a physical outlet (like active cardio) to burn off the stress response rather than just trying to sit through it. 

#### 3. If you don't schedule a break, your body will schedule it for you
We treat project timelines as hard, unyielding constraints, and treat our health, sleep, and peace of mind as flexible variables we can compress. 

It is the exact opposite. Timelines are artificial constructs, lanes on a Jira board, dates on a slide. Your body’s limits, however, are hard-coded biological laws. If you ignore the warning signs of chronic stress, your body will eventually take control of the execution loop and force a hard shutdown. In my case, it was a heavy arm and a trip to the hospital at 10\:30 PM. 

A crashed developer cannot write, review, or ship code anyway. 

---

### Reclaiming the Foundation

As developers, we pride ourselves on building robust, resilient architectures. We add rate limiters, circuit breakers, and fallback mechanisms to ensure our software survives peak loads. 

Yet, when it comes to our own lives, we run our systems at 100% capacity without a single safety valve, hoping that a daily wellness routine will prevent a crash.

I love the thrill of pair programming. But this wake-up call made one thing clear: no transpiler, no integration flow, and no release deadline is worth compromising your physical and mental health. 

It is time to re-architect my boundaries, prioritize health, and remember that protecting the engineer is the single most important step in shipping good code (even in the age of AI !).
