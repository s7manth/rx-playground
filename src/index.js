import { combineLatestWith, fromEvent, from } from "rxjs";
import { startWith, map, mergeMap } from "rxjs/operators";
import jQuery from "jquery";

const GITHUB_USER_URL = "https://api.github.com/users";

const refreshButton = document.getElementById("refreshButton");
const closeButtons = [1, 2, 3].map((i) => document.getElementById(`close${i}`));
const elements = [1, 2, 3].map((i) => document.getElementById(`element${i}`));
const images = [1, 2, 3].map((i) => document.getElementById(`image${i}`));

const refreshClickStream = fromEvent(refreshButton, "click");
const closeClickStreams = closeButtons.map((btn) => fromEvent(btn, "click"));

const requestStream = refreshClickStream.pipe(
  startWith("startup click"),
  map(() => {
    const randomOffset = Math.floor(Math.random() * 500);
    return `${GITHUB_USER_URL}?since=${randomOffset}`;
  }),
);

const responseStream = requestStream.pipe(
  mergeMap((requestUrl) => {
    console.log("Request URL:", requestUrl);
    return from(jQuery.getJSON(requestUrl));
  }),
);

const createSuggestionStream = (closeClickStream) => {
  return closeClickStream.pipe(
    startWith("startup click"),
    combineLatestWith(responseStream),
    map(([_, listUsers]) => {
      return listUsers[Math.floor(Math.random() * listUsers.length)];
    }),
    startWith(null),
  );
};

const suggestionStreams = closeClickStreams.map(createSuggestionStream);

const handleSuggestion = (index, suggestion) => {
  let element = elements[index];
  if (!element) return;

  if (suggestion === null) {
    element.style.display = "none";
  } else {
    element.style.display = "block";
    element.textContent = suggestion.login;
    element.href = `https://github.com/${suggestion.login}`;
    images[index].src = `https://github.com/${suggestion.login}.png`;
  }
};

suggestionStreams.forEach((stream, index) => {
  stream.subscribe((suggestion) => {
    handleSuggestion(index, suggestion);
  });
});
