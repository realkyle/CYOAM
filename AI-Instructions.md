# AI Instructions

## AI is not allowed to edit this file
## Only the repository owner, the human, is allowed to edit this file

## 8 April 2026, 9:50am

(using Github copilot on Auto mode as Agent)

Write a script to extract the text text of "the-cave-of-time"

Some pages have "if you do X go to page 4 if not go to page 5" type continuations, so each possible starting point should be the beginning of a new text file.

The text files should be named 00-CoT.txt where the first 2 digits correspond to the page number.

You will also need to create a graph of all the possible paths the story can proceed since it has branchging story lines. Save the graph of story possibilities in a separate file.

Ask me  questions for clarification as needed.

### 9:53am

Run the script and create the text files

### 9:56am
Write a script to write all possible stories. Save them into a separate directory

### 10:03am

Yes, "rerun it from a single canonical start page (for example page 10) to produce a smaller, stricter story set"

### 10:35am

The previous command was taking too long, so I stopped it. Was it in an infinite loop? Make sure it does not happen again.

Write out all the possible stories starting from the single page. If a troy can go on ifinitely, or if you have already gone more than 20 decision points, end the story there.

All the stories should be starting from "You've hiked through Snake Canyon once before while visiting your Uncle Howard ..." which is on page-2 of the PDF.

Check the extracted COT pages to make sure that page-2 and other pages have been extracted properly.

### 10:46am

I don't think OCR is working propoerly.

page-2 of the story, which is where the story begins, is in fact page-8 of the pdf file. Each PDF page has two pages, so page-8 of the pdf has the page 2 and 3 of the story, page-9 of the pdf has the page 4 and 5 of the story.

The stroy begins on page-2 with "You've hiked through Snake Canyon once before ..." continues on page-3 with "were shaped by running water." and the page 3 ends with the phrase "than risk losing your footing on the steep and rocky trail"

The story then offer you a choice, "If you decide to start back home turn to page 4" or "If you decide to wait, turn to page 5"

page-4 of the story, which corresponds to page-9 of pdf starts with "As you start walking abck toward the ranch,"

page-5 of the story, also on page-9 of the pdf but on the right side, starts with "You wait until morning"

You need to extract the text from pdf more carefully. Keep in mind that when the story says "turn to page 4" that refers to the page number not the pdf page.

Extract the pages again and then ask me to confirm it before going further. Each page usually ends with 1 or 2 choices of what page you can go next.

### 11:28am

This still refers to the page-2 of pdf which has the back fo the book as an excerpt.

The story begins in page-8 of the pdf, left side with "You've hiked through Snake Canyon once before ..."

Update the files and confirm with me again.

### 11:37am

I checked pages 2-5 and see that you have done a good job.

Now, extract the rest of the pages. Create and save the story graph, and write all possible stories with the restriction on avoiding infinite loops and number of decision points as I mentioned before.

You should also delete the cot-pages directory which has bad OCR extractions and any older scripts that have now been superceded.

### 11:45am

Is cot-stories-from-page-02 and cot-stories-start10 still relevant? If not delete them?

Is the tmp page relevant? If it can be easily generated from running an existing script, delete it.

Can you create a diagram of the story graph, preferrably in SVG format?

### 11:47am

Look into graph layout algorithms and use one to do a better layour of the SVG graph

### 11:49am

Go ahead and do 1 and 2 as you suggested

1. color terminal pages differently

2. highlight the main trunk from page 2

## 11:50am

Go ahead and write notes on this chat session for yourself into Codebase.md so next time you can read that document and continue the project without repeating things.

```
This should be the right “read first” file for continuing the project.Created Codebase.md as a persistent project-state note capturing the corrected OCR workflow, canonical outputs, current scripts, deleted obsolete artifacts, and the exact commands and rules needed to resume this project without repeating prior investigation.

Created Codebase.md as a persistent project-state note capturing the corrected OCR workflow, canonical outputs, current scripts, deleted obsolete artifacts, and the exact commands and rules needed to resume this project without repeating prior investigation.
```

---

## 14 April 2026

(using Claude Code)

1) read through the documents to understand project and state my steps and approach to completing this assignment (AssignmentInstruction.md read first and then rest of the .md files)

    note: we got together to create braindstorm and todo list in which then asked AI to give any suggestions and to sort our writing into a document to be read

2) review the brainstorm.md and todo.md and move into planning the web app

    note: went over the planning of web app

3) go ahead and begin

    note: watched and looked over the changes that were made one by one (with approval)

4) ive completed phase5 and believe the work does not need to be polished, could you create a README.md

    note: complete phase 5 manually to see and test the MVP

(using Github copilot)

5) ### Missing prompt information to implement phase 6 of todo.md

    note: implemented the rest of phase 6 excluding Codebase.md

6) Update Codebase.md to document the new web app architecture

   this is my project for Create your own adventure. can you update Codebase.md to document the new web app architecture please?

7) phase6 was implemented are there any other steps missing

    note: final look over by hand and AI

