import { showDashboardAlert } from "../alert.js";

const permittedEditorsPanel = document.getElementById("permittedEditorsPanel");

function bindDeleteHandler(userHeading) {
    userHeading.addEventListener("click", async () => {
        const userCard = userHeading.closest(".editor");
        const userId = userCard?.dataset.userId;

        if (!userId) {
            return;
        }

        try {
            const response = await fetch(`/dashboard/users/${userId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json"
                }
            });

            const data = await response.json().catch(() => ({}));
            showDashboardAlert(data.message || "Request processed.");

            if (response.ok) {
                userCard.remove();
            }
        } catch (error) {
            showDashboardAlert("Unable to delete user right now.");
        }
    });
}

function appendPermittedUser(user) {
    if (!user || !user.id || !user.name || !user.status) {
        return;
    }

    if (document.querySelector(`.editor[data-user-id='${user.id}']`)) {
        return;
    }

    const userCard = document.createElement("div");
    userCard.className = `editor ${user.status}`;
    userCard.dataset.userId = user.id;
    userCard.dataset.userStatus = user.status;

    const icon = document.createElement("img");
    icon.src = "../static/assets/dashboard/editor-icon.png";
    icon.alt = "Editor icon";

    const heading = document.createElement("h3");
    heading.textContent = user.name;
    heading.dataset.deletable = "true";

    bindDeleteHandler(heading);

    userCard.appendChild(icon);
    userCard.appendChild(heading);
    permittedEditorsPanel.appendChild(userCard);
}

document.getElementById("addEditorForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = document.getElementById("editorName").value.trim();
    const email = document.getElementById("editorEmail").value.trim();

    try {
        const response = await fetch("/dashboard/invite", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name, email })
        });

        const data = await response.json().catch(() => ({}));
        showDashboardAlert(data.message || "Request processed.");

        if (response.ok) {
            document.getElementById("editorName").value = "";
            document.getElementById("editorEmail").value = "";
            appendPermittedUser(data.user);
        }
    } catch (error) {
        showDashboardAlert("Unable to send invite right now.");
    }
});

document.querySelectorAll("#permittedEditorsPanel .editor h3[data-deletable='true']").forEach((userHeading) => {
    bindDeleteHandler(userHeading);
});