let API_RESULTS_LIMIT = 5;
let OFFSET = 0;
let CURRENT_PAGE = 1;
const CITY_GET_URL = "https://wft-geo-db.p.rapidapi.com/v1/geo/cities";
const COUNTRY_FLAG_GET_URL = "https://www.countryflagsapi.com/png";
const FETCH_OPTIONS = {
  method: "GET",
  headers: {
    "X-RapidAPI-Key": "4ac5e3352fmshe6ac515ca3b8ccap1f0045jsnf0a504a87bbe",
    "X-RapidAPI-Host": "wft-geo-db.p.rapidapi.com",
  },
};
const PLACES_TABLE_FIELDS_MAP = {
  id: {
    heading: "#",
    getHtml: function (element, index) {
      return `<td>${index + 1}</td>`;
    },
  },
  name: {
    heading: "Place name",
    getHtml: function (element, index) {
      return `<td>${element.name}</td>`;
    },
  },
  country: {
    heading: "Country",
    getHtml: function (element, index) {
      return `
      <td class="country-name-row">
      <img crossorigin="anonymous" src="${COUNTRY_FLAG_GET_URL}/${element.countryCode.toLowerCase()}" />
      ${element.country}
      </td>`;
    },
  },
  population: {
    heading: "Population",
    getHtml: function (element, index) {
      return `<td>${element.population}</td>`;
    },
  },
  region: {
    heading: "Region",
    getHtml: function (element, index) {
      return `<td>${element.region}</td>`;
    },
  },
};

const checkedTableFields = ["id", "name", "country"];
let places_results;
let totalPage;

const searchPlacesInput = document.querySelector(".search-field");
const searchBtn = document.querySelector(".search-btn");

const placesTableContainer = document.querySelector(".places-table-container");
const fieldCheckboxesContainer = document.querySelector(
  ".fields-checkbox-container"
);

const paginationContainer = document.querySelector(".pagination-container");
const pageInfo = document.querySelector(".page-info");
const paginationResultContainer = document.querySelector(
  ".pagination-result-container"
);
const prevPageBtn = document.querySelector(".previous-page-btn");
const nextPageBtn = document.querySelector(".next-page-btn");

const resultsLimitInput = document.querySelector("#results-limit-input");
const resultsLimitInputError = document.querySelector(
  ".results-limit-input-error"
);

const updatePaginationUI = function () {
  if (CURRENT_PAGE === 1 && totalPage === 1) {
    prevPageBtn.style.display = "none";
    nextPageBtn.style.display = "none";
  } else if (CURRENT_PAGE === 1) {
    prevPageBtn.style.display = "none";
    nextPageBtn.style.display = "block";
  } else if (CURRENT_PAGE === totalPage) {
    nextPageBtn.style.display = "none";
    prevPageBtn.style.display = "block";
  } else {
    prevPageBtn.style.display = "block";
    nextPageBtn.style.display = "block";
  }

  pageInfo.innerHTML = `<p>Page ${CURRENT_PAGE} / ${totalPage}</p>`;
};

const renderPlacesTable = function (emptySearch, placesData) {
  if (emptySearch) {
    placesTableContainer.innerHTML = "<p>Start searching...</p>";
    paginationContainer.style.display = "none";
    return;
  }

  if (placesData.error) {
    placesTableContainer.innerHTML = `<p>${placesData.error}</p>`;
    paginationContainer.style.display = "none";
    return;
  }

  if (placesData.data?.length === 0) {
    placesTableContainer.innerHTML = `<p class="error-msg">No results found.</p>`;
    paginationContainer.style.display = "none";
    return;
  }

  if (!placesData.data) {
    placesTableContainer.innerHTML = `<p>Something went wrong</p>`;
    paginationContainer.style.display = "none";
    return;
  }

  let resultRows = "";

  placesData.data.forEach((element, index) => {
    resultRows += `<tr>
      ${checkedTableFields.reduce((rowString, field) => {
        return (
          rowString +
          PLACES_TABLE_FIELDS_MAP[`${field}`].getHtml(element, index)
        );
      }, "")}
    </tr>`;
  });

  placesTableContainer.innerHTML = `
    <table class="places-data-table">
      <thead>
      ${checkedTableFields.reduce((headerString, field) => {
        return (
          headerString +
          `<th>${PLACES_TABLE_FIELDS_MAP[`${field}`].heading}</th>`
        );
      }, "")}
      </thead>
      <tbody>
        ${resultRows}
      </tbody>
    </table>`;

  fieldCheckboxesContainer.style.display = "flex";
  paginationContainer.style.display = "flex";

  totalPage = Math.ceil(+placesData.metadata.totalCount / API_RESULTS_LIMIT);

  updatePaginationUI();
};

const searchPlaces = async function () {
  const searchValue = searchPlacesInput.value;

  if (!searchValue) {
    renderPlacesTable(true);
    return;
  }

  const url = `${CITY_GET_URL}?namePrefix=${searchValue}&limit=${API_RESULTS_LIMIT}&OFFSET=${OFFSET}`;

  try {
    placesTableContainer.innerHTML = `<div class="loader"></div>`;
    fieldCheckboxesContainer.style.display = "none";

    let response = await fetch(url, FETCH_OPTIONS);
    places_results = await response.json();

    renderPlacesTable(false, places_results);
  } catch (error) {
    renderPlacesTable(false, { error: error.message });
  }
};

const toggleTableFields = function (event) {
  const checked = event.target.checked;
  const field = event.target.value;

  if (!checked && !field) {
    return;
  }

  if (checked) {
    checkedTableFields.push(field);
  } else {
    const index = checkedTableFields.indexOf(field);

    if (index > -1) {
      checkedTableFields.splice(index, 1);
    }
  }

  renderPlacesTable(false, places_results);
};

const onAPIResultsLimitChange = async function () {
  const resultsLimit = resultsLimitInput.value;

  if (resultsLimit < 5 || resultsLimit > 10) {
    resultsLimitInputError.innerHTML =
      "Results per page can not be less than 5 or more than 10";
    resultsLimitInputError.style.display = "block";
    resultsLimitInput.value = resultsLimit < 5 ? 5 : 10;
    return;
  }

  resultsLimitInputError.style.display = "none";

  API_RESULTS_LIMIT = resultsLimit;
  OFFSET = 0;
  CURRENT_PAGE = 1;

  searchPlaces();
};

const onPageChange = async function (e) {
  const pagesContainer = e.target.classList;

  if (pagesContainer.contains("previous-page-btn")) {
    CURRENT_PAGE -= 1;
    if (CURRENT_PAGE <= 0) {
      CURRENT_PAGE = 0;
    }
    OFFSET = (CURRENT_PAGE - 1) * API_RESULTS_LIMIT;
  }

  if (pagesContainer.contains("next-page-btn")) {
    CURRENT_PAGE += 1;
    if (CURRENT_PAGE > totalPage) {
      CURRENT_PAGE = totalPage;
    }
    OFFSET = (CURRENT_PAGE - 1) * API_RESULTS_LIMIT;
  }

  await searchPlaces();
};

const flushSerchResults = function () {
  OFFSET = 0;
  CURRENT_PAGE = 1;
  totalPage = 0;
  API_RESULTS_LIMIT = 5;

  resultsLimitInput.value = API_RESULTS_LIMIT;
  placesTableContainer.innerHTML = "";
  fieldCheckboxesContainer.style.display = "none";
  paginationContainer.style.display = "none";
};

const searchOnKeyPress = async function (e) {
  if (e.key === "Enter") {
    await searchPlaces();
  }
};

const searchInputFieldFocus = function (e) {
  if (e.ctrlKey && e.key === "/") {
    searchPlacesInput.focus();
  }
};

searchPlacesInput.addEventListener("keypress", searchOnKeyPress);
searchPlacesInput.addEventListener("input", flushSerchResults);
searchBtn.addEventListener("click", searchPlaces);
fieldCheckboxesContainer.addEventListener("click", toggleTableFields);
paginationResultContainer.addEventListener("click", onPageChange);
resultsLimitInput.addEventListener("change", onAPIResultsLimitChange);

document.body.addEventListener("keydown", searchInputFieldFocus);
