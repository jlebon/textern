/* vim: set et ts=4 tw=92:
 *
 * Copyright (C) 2017 Jonathan Lebon
 *
 * This file is part of Textern.
 * Textern is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Textern is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Textern.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

function onError(error) {
    console.log(`Error: ${error}`);
}

function saveOptions(e) {
    e.preventDefault();
    browser.storage.local.set({
        editor: document.querySelector("#editor").value,
        extension: document.querySelector("#extension").value
    });
    document.querySelector("#saved").innerHTML = '\u2713';
}

function clearCheckmark(e) {
    document.querySelector("#saved").innerHTML = "";
}

function restoreOptions() {

    browser.storage.local.get("editor").then(result => {
        document.querySelector("#editor").value = result.editor || "[\"gedit\"]";
    }, onError);

    browser.storage.local.get("extension").then(result => {
        document.querySelector("#extension").value = result.extension || "txt";
    }, onError);
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
document.querySelectorAll("form > input").forEach(
    function(value, key, listObj, argument) {
        value.addEventListener("input", clearCheckmark);
    }
)
