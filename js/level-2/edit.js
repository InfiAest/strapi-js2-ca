import { baseUrl } from "../common/settings/api.js";
import { getExistingFavouriteArticles, getToken, saveToFavouriteArticles } from "../common/utils/storage.js";
import displayMessage from "../common/components/displayMessage.js";
import createNavBar from "../common/components/createNavBar.js";
import deleteArticleButton from "./components/buttons/deleteArticleButton.js";

const token = getToken();

if(!token) {
    location.href = "/";
}

createNavBar();

const queryString = document.location.search;
const params = new URLSearchParams(queryString);
const id = params.get("id");

if (!id) {
    document.location.href = "/";
}

const articleUrl = baseUrl + "articles/" + id;

const form = document.querySelector("form");
const title = document.querySelector("#title");
const summary = document.querySelector("#summary");
const author = document.querySelector("#author");
const idInput = document.querySelector("#id");
const messageContainer = document.querySelector(".message-container");
const loadingContainer = document.querySelector(".loading");

(async function() {

    try {
        const response = await fetch(articleUrl);
        const details = await response.json();

        title.value = details.title;
        summary.value = details.summary;
        author.value = details.author;
        idInput.value = details.id;

        deleteArticleButton(details.id);
    }
    catch (error) {
        console.log(error);
    }
    finally {
        loadingContainer.style.display = "none";
        form.style.display = "block";
    }

})();


form.addEventListener("submit", editArticle);

function editArticle(event) {
    event.preventDefault();

    messageContainer.innerHTML = "";

    const titleValue = title.value.trim();
    const summaryValue = summary.value.trim();
    const authorValue = author.value.trim();
    const idValue = idInput.value;
    
    if (titleValue.length === 0 || summaryValue.length === 0 || authorValue.length === 0) {
        return displayMessage("warning", "Supply proper values", ".message-container");
    }

    updateArticle(titleValue, summaryValue, authorValue, idValue);
}

async function updateArticle(title, summary, author, id) {

    const url = baseUrl + "articles/" + id;
    const data = JSON.stringify({ title: title, summary: summary, author: author });

    const options = {
        method: "PUT",
        body: data,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
    };

    try {
        const response = await fetch(url, options);
        const json = await response.json();

        if (json.updated_at) {
            displayMessage("success", "Article updated", ".message-container");

           //find out if this article is in the favourites array in the storage
            const currentFavouriteArticles = getExistingFavouriteArticles();
            const articleExists = currentFavouriteArticles.find(function(article) {
                return article.id === id;
            });
            console.log(articleExists);

            //if it is in the favourites array then:
            if(articleExists) {
                //remove the article from the array if the id matches that of the current articles id
                //and save that favourites array again
                const updatedFavouriteArticles = currentFavouriteArticles.filter(article => article.id !== id);
                saveToFavouriteArticles(updatedFavouriteArticles);

                //then get that favourites array again
                //create the updated article with the info from the current page
                //and push it to the favourites array
                const updatedArticle = { id: id, title: title, summary: summary, author: author };
                const newFavouriteArticles = getExistingFavouriteArticles();
                newFavouriteArticles.push(updatedArticle);
                saveToFavouriteArticles(newFavouriteArticles);
            }

        }

        if (json.error) {
            displayMessage("error", json.message, ".message-container");
        }
    }
    catch (error) {
        console.log(error);
    }

}
