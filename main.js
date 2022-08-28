import express from "express";
import got from "got";
import util from 'util'

function randInt(max) {
  return Math.floor(Math.random() * max);
}

function filterLinks(links) {
  for (let i = links.length - 1; i >= 0; i--) {
    if (
      links[i].indexOf("File") >= 0 ||
      links[i].indexOf("Wikipedia") >= 0 ||
      links[i].indexOf("Free_content") >= 0 ||
      links[i].indexOf("Help") >= 0 ||
      links[i].indexOf("Special") >= 0 ||
      links[i].indexOf("English_language") >= 0 ||
      links[i].indexOf("Encyclopedia") >= 0 ||
      links[i].indexOf(":") >= 0 ||
      links[i] == undefined
    ) {
      links.splice(i, 1);
    }
  }
}

function extractLinks(html) {
  let links = Array.from(html.matchAll(/href="\/wiki\/([^"]*)"/g), (m) => m[1]);
  filterLinks(links);
  return links;
}

function selectRandom(arr, n) {
  let selected = [];
  for (let i = 0; i < n; i++) {
    selected.push(arr[i]);
    arr.splice(i, 1);
  }
  return selected;
}

async function requestHTML(url) {
  counter += 1
  // console.log('Fetching', url)
  try {
    const result = await got(url);
    return result.body;
  } catch (err) {
    return "";
  }
}


function selectLinkPath(links) {
  let idx = randInt(links.length-1);
  [links[idx], links[links.length-1]] = [links[links.length-1], links[idx]]
  let nextLink = links.pop();
  return nextLink;
}


async function recurseCollectLinks(url, wikilinks, path, onPath, depth, width) {
  if (depth < 1) {
    return
  }

  let html = await requestHTML(url);
  let links = extractLinks(html);
  let selected = selectRandom(links, width);
  let nextLink = selectLinkPath(selected);
  
  if (onPath) {
    path.push(nextLink);
  }
  
  wikilinks[nextLink] = {};
  url = "https://en.wikipedia.org/wiki/" + nextLink;
  await recurseCollectLinks(url, wikilinks[nextLink], path, onPath, depth-1, width)
  
  for (let link of selected) {
    wikilinks[link] = {};
    url = "https://en.wikipedia.org/wiki/" + link;
    await recurseCollectLinks(url, wikilinks[link], path, false, depth-1, width);
  }
}


async function getWikiLinks(depth, width) {
  let url = "https://en.wikipedia.org/wiki/Main_Page"; // input your url here
  
  let html = await requestHTML(url);
  let links = extractLinks(html);
  let selected = selectRandom(links, width);
  let startLink = selectLinkPath(selected);
  
  let wikilinks = {};
  wikilinks[startLink] = {};
  let path = [startLink];

  url = "https://en.wikipedia.org/wiki/" + startLink;
  await recurseCollectLinks(url, wikilinks[startLink], path, true, depth, width);

  return [wikilinks, path];
}

function runServer() {
  const app = express();
  const port = process.env.PORT || 8080;

  // app.use(express.static(__dirname + "/public"));

  app.get("/", function (req, res) {
    res.render("index.html");
  });

  app.listen(port);
  console.log("Server started at: http://localhost:" + port);
}

let counter = 0;
let depth = 2  // Length of link path
let width = 2  // Number of links from each page
let nPages = 1 + (Math.pow(width, depth)-1) / (width-1)
if (nPages < 100) {
  console.log(nPages)
  let [wikilinks, path] = await getWikiLinks(depth, width);
  console.log(wikilinks, path);
  console.log(util.inspect(wikilinks, false, null, true /* enable colors */))
  
  console.log(counter);
  // runServer();
}