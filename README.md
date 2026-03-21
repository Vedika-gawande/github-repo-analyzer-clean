# Wings-Hackathon
📁 Project File Structure

project/
├── backend/
│   ├── analyzers/
│   ├── controllers/
│   ├── routes/
│   │   ├── analyze.js
│   │   ├── structure.js
│   │   ├── entrypoint.js
│   │   ├── dependencies.js
│   │   └── summary.js
│   ├── services/
│   │   ├── githubService.js
│   │   ├── parser.js
│   │   ├── dependencyMapper.js
│   │   └── aiProcessor.js
│   ├── utils/
│   ├── server.js
│   ├── test-routes.js
│   └── .env
└── frontend/
    └── src/
        └── index.html

PROMPT 1:

I need a function that takes a GitHub repository URL from the frontend and fetches all the files and folders. 
It should return a structured list of files and directories. 
Focus on public repositories first. 
Keep the function simple so I can build analysis on top of it. give the excat and most correct folder strcuture for this

PROMPT 2:
I’m starting a new project and I want to set up a basic Node.js backend with a simple frontend.

Help me create a clean project structure with the main files already in place so I can build step by step.

On the backend side:

* Create an `index.js` file to run the server
* Add a `github.js` file to handle fetching repository data
* Add an `analyzer.js` file to process and analyze that data
* Add an `ai.js` file where I’ll handle AI-based formatting
* Add a `supabase.js` file for database connection

On the frontend side:

* Create a `frontend` folder with a simple `index.html`

Keep everything minimal for now — just basic file setup with placeholder comments so I can understand and build each part gradually.

The goal is to have a clean starting point without overcomplicating anything.

PROMPT 3:
I’m working on a Node.js backend and need a small utility file to handle files and folders.

I want simple functions to:

get all files recursively
get all folders recursively
read file content as a string
get a relative path from a base path

Use only built-in Node.js modules like fs and path.

Keep the code clean, simple, and add small comments so it’s easy to understand.

PROMPT 4:
I want to build a folder structure analyzer for my project.

Given a local repository path, it should scan the main (top-level) folders and identify important ones like src, controllers, routes, models, services, utils, config, middleware, public, and tests.

For each folder, return its name along with a short, simple description.

Keep the output clean and structured as a JSON array, and keep the logic simple and easy to understand.

I need to create an API for the folder structure part of my project.


PROMPT 5:
Basically, I want a POST route at /api/structure where I can send a localPath in the request.

When this API is called, it should take that path, run the folder analyzer, and send back the result as a clean JSON response with a folderStructure array.

Keep everything simple and easy to follow, and make sure it handles errors properly in case something goes wrong.

PROMPT 6:
I want to add entry point detection to my project.

The idea is to scan all the files in a repository and try to find the main starting file, like server.js, index.js, app.js, main.js, or even main.py.

Once found, return basic details like the file name, its path, and a short explanation in simple English about what this file does.

If no entry point is found, just return null.

Keep the logic simple and easy to understand.


PROMPT 7:
Route Testing Script*
I want to create a simple test script to check all my API routes.

Create a file called `test-routes.js` inside the backend folder using only the built-in Node.js `http` module.

The script should test all routes step by step:

* First call `POST /api/analyze` with a real GitHub repo URL
* Then take the returned `localPath` and use it to test:

  * `POST /api/structure`
  * `POST /api/entrypoint`
  * `POST /api/dependencies`

For each route, print whether it passed or failed, along with some important parts of the response.

At the end, show a simple summary of how many routes passed.

Keep everything simple and easy to understand.


I want to build an AI processor using the Google Gemini API.

This function should take all the analyzed data like repo name, folder structure, entry point, dependencies, and some basic stats, and then create a simple prompt from it.

Use the Gemini model (gemini-1.5-flash) to generate output.

The response should be cleaned and converted into JSON, and return:

* a short summary (2–3 lines)
* 3 useful insights about the project
* a techStack array

If something goes wrong with the API, return a safe fallback response.

Also make sure to clean the response properly before parsing (remove backticks or extra formatting).


I want to create an API endpoint for generating an AI summary.

Set up a POST route at `/api/summary` that takes `localPath` and `repoName` from the request.

First, validate that both values are present.

Then run all the analyzers together, pass the combined result to the AI processor, and return a clean JSON response with summary, insights, and techStack.

Keep it simple and handle errors properly so it doesn’t break.


Some of my API routes like `/api/structure`, `/api/entrypoint`, and `/api/dependencies` are not working and returning 404.

Check if all route files are properly imported in `server.js` and connected using `app.use()`.

Also print all registered routes when the server starts so I can verify everything is connected correctly.

Keep it simple and easy to debug.


This is the prob statement on which we are building the soln in hackathon and i am working on repo fetcher feature so what prompt should i give to build that feature and i will give you the basic info of what all we are doing and then accordingly give me a prompt to build that feature and we've generated the basic folder structure in project repo so accordingly also System Architecture


Q: What should happen after the repo is cloned — does the repo fetcher just clone & return the file tree, or should it also trigger the analyzers immediately?
A: what will be best suitable as we are trying all this first time and currently sitting in hackathon and i am working on this feature while other teammates will handle other parts simultaneously so please you only explain workflow and what each should do now properly and in understandable terms