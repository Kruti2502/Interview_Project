const options = {
  method: "GET",
  headers: {
    "X-RapidAPI-Key": "4ac5e3352fmshe6ac515ca3b8ccap1f0045jsnf0a504a87bbe",
    "X-RapidAPI-Host": "wft-geo-db.p.rapidapi.com",
  },
};

const tableFieldsMap = {
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
      <img crossorigin="anonymous" src=https://www.countryflagsapi.com/png/${element.countryCode.toLowerCase()} />
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

let APILimit = 5;
let offset = 0;

let currPage = 1;
let totalPage;

const searchField = document.querySelector(".search-field");
const searchBtn = document.querySelector(".search-btn");

const resultTableContainer = document.querySelector(".result-table-container");
const fieldCheckboxesContainer = document.querySelector(
  ".fields-checkbox-container"
);

const paginationContainer = document.querySelector(".pagination-container");
const pageInfo = document.querySelector(".page-info");
const paginationResultContainer = document.querySelector(
  ".pagination-result-container"
);
const prevPageBtn = document.querySelector(".prev-page-btn");
const nextPageBtn = document.querySelector(".next-page-btn");

const limitInput = document.querySelector("#limit-input");
const limitInputError = document.querySelector(".limit-input-error");

const getCheckboxesHTML = function () {
  let html = "";

  for (field of TABLE_FIELDS) {
    html += `
    <input type="checkbox" class="checkbox" name="${field}" value="${field}" ${
      DEFAULT_TABLE_FIELDS.includes(field)
        ? 'disabled="disabled" checked="checked"'
        : ""
    }/>
    <label for="${field}">
    ${field.charAt(0).toUpperCase() + field.slice(1)}</label>
    `;
  }

  return html;
};

const showSearchResult = function (emptySearch, resultData) {
  console.log(resultData);
  if (emptySearch) {
    resultTableContainer.innerHTML = "<p>Start searching..</p>";
    paginationContainer.style.display = "none";
    return;
  }

  if (resultData.error) {
    resultTableContainer.innerHTML = `<p>${resultData.error}</p>`;
    paginationContainer.style.display = "none";
    return;
  }

  if (resultData.data?.length === 0) {
    resultTableContainer.innerHTML = `<p>No results found</p>`;
    paginationContainer.style.display = "none";
    return;
  }

  let resultRows = "";
  if (!resultData.data) {
    resultTableContainer.innerHTML = `<p>Something went wrong</p>`;
    paginationContainer.style.display = "none";
    return;
  }

  resultData.data.forEach((element, index) => {
    resultRows += `
    <tr>
      ${checkedTableFields.map((field) => {
        return tableFieldsMap[`${field}`].getHtml(element, index);
      })}
    </tr>
    `;
  });

  resultTableContainer.innerHTML = `<table class="places-data-table">
    <thead>
    ${checkedTableFields.map((field) => {
      return `<th>${tableFieldsMap[`${field}`].heading}</th>`;
    })}
    </thead>
    <tbody>
      ${resultRows}
    </tbody>
  </table>
  `;

  fieldCheckboxesContainer.style.display = "block";
  paginationContainer.style.display = "flex";

  totalPage = Math.ceil(+resultData.metadata.totalCount / APILimit);

  if (currPage === 1 && totalPage === 1) {
    prevPageBtn.style.display = "none";
    nextPageBtn.style.display = "none";
  } else if (currPage === 1) {
    prevPageBtn.style.display = "none";
    nextPageBtn.style.display = "block";
  } else if (currPage === totalPage) {
    nextPageBtn.style.display = "none";
    prevPageBtn.style.display = "block";
  } else {
    prevPageBtn.style.display = "block";
    nextPageBtn.style.display = "block";
  }

  pageInfo.innerHTML = `
  <p>Page ${currPage} of ${totalPage}</p>
  `;
};

const onLimitChange = async function () {
  const limit = limitInput.value;
  if (limit < 5 || limit > 10) {
    limitInputError.innerHTML = "Limit can not be less than 5 or more than 10";
    limitInputError.style.display = "block";
    limitInput.value = limit < 5 ? 5 : 10;
    return;
  }

  limitInputError.style.display = "none";
  APILimit = limit;
  offset = 0;
  currPage = 1;
  searchFunc();
};

const onChangePage = async function (e) {
  const page = e.target.classList;
  if (page.contains("prev-page-btn")) {
    currPage -= 1;
    if (currPage <= 0) {
      currPage = 0;
    }
    offset = (currPage - 1) * APILimit;
  }

  if (page.contains("next-page-btn")) {
    currPage += 1;
    if (currPage > totalPage) {
      currPage = totalPage;
    }
    offset = (currPage - 1) * APILimit;
  }

  await searchFunc();
};

const searchFunc = async function () {
  const searchValue = searchField.value;

  if (!searchValue) {
    showSearchResult(true);
    return;
  }

  const searchUrl = `https://wft-geo-db.p.rapidapi.com/v1/geo/cities?namePrefix=${searchValue}&limit=${APILimit}&offset=${offset}`;

  try {
    resultTableContainer.innerHTML = `<div class="loader"></div>`;

    let response = await fetch(searchUrl, options);
    places_results = await response.json();
    showSearchResult(false, places_results);
  } catch (error) {
    showSearchResult(false, { error: error.message });
  }
};

const clearResults = function () {
  resultTableContainer.innerHTML = "";
  fieldCheckboxesContainer.style.display = "none";
  paginationContainer.style.display = "none";
};

const searchOnKeyPress = async function (e) {
  if (e.key === "Enter") {
    await searchFunc();
  }
};

const searchInputFieldFocus = function (e) {
  if (e.ctrlKey && e.key === "/") {
    searchField.focus();
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

  showSearchResult(false, places_results);
};

searchBtn.addEventListener("click", searchFunc);
fieldCheckboxesContainer.addEventListener("click", toggleTableFields);
limitInput.addEventListener("change", onLimitChange);
paginationResultContainer.addEventListener("click", onChangePage);
searchField.addEventListener("input", clearResults);
searchField.addEventListener("keypress", searchOnKeyPress);
document.body.addEventListener("keydown", searchInputFieldFocus);
