import express from "express";
import got from "got";

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
      links[i].indexOf(":") >= 0
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
  try {
    const result = await got(url);
    return result.body;
  } catch (err) {
    return "";
  }
}

async function getWikiLinks(length) {
  let wikilinks = [];

  let url = "https://en.wikipedia.org/wiki/Main_Page"; // input your url here

  let html = await requestHTML(url);
  let links = extractLinks(html);
  let selected = selectRandom(links, 10);
  let nextLink = selected[randInt(selected.length - 1)];
  wikilinks.push({ link: nextLink, others: selected });
  url = "https://en.wikipedia.org/wiki/" + nextLink;

  for (let i = 0; i < length - 1; i++) {
    let html = await requestHTML(url);
    let links = extractLinks(html);
    let selected = selectRandom(links, 10);
    let nextLink = selected[randInt(selected.length - 1)];
    wikilinks.push({ link: nextLink, others: selected });
    url = "https://en.wikipedia.org/wiki/" + nextLink;
  }
  console.log("wikilinks", wikilinks);

  return wikilinks;
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

let length = 5
getWikiLinks(length).then((wikilinks) => {
  console.log(wikilinks);
  runServer();
});
