/* vim: set et ts=4 tw=92:
 * Copyright (C) 2017-2018  Jonathan Lebon <jonathan@jlebon.com>
 * This file is part of Textern.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

"use strict";

function onError(error) {
    console.log(`Error: ${error}`);
}

function saveOptions(e) {
    e.preventDefault();
    browser.storage.local.set({
        editor: document.querySelector("#editor").value,
        extension: document.querySelector("#extension").value,
        backupdir: document.querySelector("#backupdir").value
    });
    document.querySelector("#saved").innerHTML = '\u2713';
}

function clearCheckmark(e) {
    document.querySelector("#saved").innerHTML = "";
}

function restoreOptions() {

    browser.storage.local.get("editor").then(result => {
        document.querySelector("#editor").value =
            result.editor || "[\"gedit\", \"+%l:%c\"]";
    }, onError);

    browser.storage.local.get("extension").then(result => {
        document.querySelector("#extension").value = result.extension || "txt";
    }, onError);

    browser.storage.local.get("backupdir").then(result => {
        document.querySelector("#backupdir").value = result.backupdir || "";
    }, onError);
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
document.querySelectorAll("form > input").forEach(
    function(value, key, listObj, argument) {
        value.addEventListener("input", clearCheckmark);
    }
)
