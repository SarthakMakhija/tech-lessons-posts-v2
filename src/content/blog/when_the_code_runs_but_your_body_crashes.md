---
author: "Sarthak Makhija"
title: "When the Code Runs but Your Body Crashes: Re-evaluating Boundaries Under Crazy Timelines"
description: "A personal story of a long pairing day, a midnight hospital run, and why we must prioritize biological constraints over artificial deadlines."
pubDate: 2026-06-09
draft: true
tags: ["Developer Health", "Software Craftsmanship", "Personal Reflection"]
---

June 8th 2026 began like any other intense day of pairing. My colleague and I were in the trenches, working on a complex experiment: building a transpiler from **UniBasic** to structured, modern **Java**. 

We were deep in the integration phase, trying to fit the newly generated Java code back into our end-to-end execution flow. When you are writing a transpiler, the problem space is incredibly dense. But the real complexity starts during integration: you are bridging two completely different worlds, the legacy UniBasic execution flow and the new Java execution flow. When an error occurs, tracking it down is incredibly difficult because you have to debug and cross-reference both environments to find the root cause. This debugging loop demands long, exhausting hours of continuous pairing. Because of the crazy project timelines, the pressure to make this end-to-end integration work was intense.

We paired all day, trying to maintain a high-intensity focus. Around 7\:50 PM, we finally decided to close our editors. The code compiled, the integration worked, and the day's sprint was technically a success. 

I shut my laptop, feeling the familiar exhaustion of a day's work, but reassured by the fact that I was doing \"decent\" in life. I climb stairs, I do yoga daily, and I maintain my health. 

But my body had a different plan.

---

### The Alarm: A Timeline of Symptoms

At 8\:15 PM, I stepped onto my yoga mat for a scheduled 1-hour session. I expected the quiet stretching and breathing exercises to act as a system flush, a quick decompression sequence to wash away the stress of the day.

Instead, I felt immediately uncomfortable. By the end of the session, a dull pain settled into my chest. I tried to write it off: *It's just bone pain, a minor strain from yoga.* I had dinner, hoping a bit of rest would resolve it.

But around 10\:30 PM, a new symptom arrived: my left arm began to feel heavy. 

In the tech world, we are trained to identify anomalies and debug them before they trigger system failures. A heavy left arm and chest pain are the highest-severity alerts a human body can throw. We decided not to wait. We got into the car and drove to the hospital.

---

### The Breakpoint: Running the Diagnostics

By midnight, I was sitting in a room, hooked up to an ECG and ECHO.

The medical team ran the standard diagnostic suite for a high-priority incident:

* **ECG:** Normal.
* **ECHO:** Normal.
* **Blood Tests:** Normal.

The physical machinery of my heart was fine. But the system metrics were highly elevated: both my heart rate and my blood pressure were significantly above normal. 

The doctor looked at the charts, looked at me, and delivered a simple diagnosis: *it was mostly stress and anxiety.*

Then, he gave me a piece of advice that highlighted how differently our bodies release stress. He suggested that for my current state of high adrenaline, I should prioritize active, physical movement, like a brisk walk (5 KMs) or cardio, and pause on forced quiet sessions for a bit.

It was in that quiet moment in the hospital room that the pieces started coming together. A single day's intense effort doesn't trigger a physiological crash on its own. What I began to realize was that this wasn't a one-day problem. It was the cumulative effect of weeks of sustained pressure, endless context-switching, and carrying the complex weight of transpiler architecture in my head day after day. You think you are successfully buffering the stress, but the physiological debt accumulates quietly in the background.

And that night, my body decided it was time to collect.

---

### The 100% CPU Trap: Profiling the Developer

In our industry, we take immense pride in our work. We often celebrate the long hours, the late-night integrations, and the thrill of seeing a complex project delivered successfully. We wear our exhaustion like a badge of honor, bragging about our marathon pairing sessions. 

But at what cost?

If we were monitoring a production server and saw the CPU pegged at 100% for days, we would treat it as a high-severity incident. We would immediately run a CPU profile, and identify the top CPU consumers. We would never just let the CPU run at maximum capacity until the hardware physically burned out. 

Yet, when it comes to ourselves, we run our own mental and physical CPUs at 100% capacity week after week. We ignore the thermal warning signs, the constant fatigue, the elevated heart rate, the shallow breathing, and the subtle anxiety. We expect our systems to somehow self-heal without any reduction in throughput, waiting for an unhandled physical breakdown to finally force us to pause. 

Why do we not run a self-profile? Why do we wait for a complete crash to audit our own allocations, thread exhaustion, and stress levels? Protecting our own personal "CPU cycles" is not a sign of weakness; it is the only way to build a sustainable engineering practice.

---

### Three Lessons from a Midnight Wake-Up Call

This hospital visit was a loud wake-up call. It forced me to look at the boundaries I had set between my life and my work, and realize that my current mental model was fundamentally broken.

Here are the key takeaways from that night:

#### 1. Build circuit breakers into pairing: Take structured breaks
Pair programming is incredibly high-leverage, but it is also cognitively exhausting. When you pair, you are constantly communicating, context-switching, and thinking aloud. We need to build structural circuit breakers into our day. Ensure you take a break every 30 to 40 minutes, using a Pomodoro timer if needed, to stand up, step away from the screen, and let your brain reset.

#### 2. Physical activity is a non-negotiable stress release
When you spend all day solving dense logical problems under timeline pressure, your body accumulates physiological stress. You cannot think this stress away. Active physical movement, whether it is a long walk (like 5 KMs), a gym session, or whatever active movement works for you, is non-negotiable. Your body needs a physical outlet to burn off the chemical build-up of stress and return to a healthy baseline. 

#### 3. Keep project timelines reasonable and team-driven
We often treat project timelines as hard constraints and compromise our health to meet them. But timelines are artificial. More importantly, commitments shouldn't be forced from the top down or made on behalf of the team. Estimates and commitments must be run by the team doing the work. Reasonable timelines are not just about project management; they are a fundamental health requirement.

---

### Protecting the Most Critical Infrastructure

As developers, we pride ourselves on building robust, resilient architectures. We add rate limiters, circuit breakers, and fallback mechanisms to ensure our software survives peak loads. 

Yet, when it comes to our own lives, we run our systems at 100% capacity without a single safety valve, hoping that a daily wellness routine will prevent a crash.

Taking care of your self-health isn't a check-box exercise. It is not about simply logging a workout, hitting a step count, or completing a meditation session to satisfy a daily health dashboard. If you treat wellness as just another list of tasks to squeeze into an already overloaded schedule, you miss the point. True self-health is about listening to your body's telemetry, recognizing when your system is red-lining, and having the courage to halt the pipeline. It is acknowledging that your physical and mental well-being is the baseline infrastructure that runs everything else. If the infrastructure fails, no amount of clean code or successful integrations will matter.

I love the thrill of pair programming. But this wake-up call made one thing clear: no transpiler, no integration flow, and no release deadline is worth compromising your physical and mental health. 

It is time to re-architect my boundaries, prioritize health, and remember that protecting the engineer is the single most important step in shipping good code (even in the age of AI !).
