
const API = "/api";

let rotation = 0;
let spinning = false;

// ----------------------------------
// API HELPER
// ----------------------------------

async function api(url, options = {}) {
    const response = await fetch(API + url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    const text = await response.text();
    let data = {};

    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        throw new Error("Invalid server response. Please check your backend.");
    }

    if (!response.ok) {
        throw new Error(data.message || "Something went wrong.");
    }

    return data;
}

// ----------------------------------
// REFRESH ALL DASHBOARD DATA
// ----------------------------------

async function refresh() {
    try {
        await Promise.all([
            loadRoommates(),
            loadChores(),
            loadHistory()
        ]);
    } catch (error) {
        console.error("Refresh error:", error);
        alert(error.message);
    }
}

// ----------------------------------
// ROOMMATES
// ----------------------------------

async function addRoommate() {
    const input = document.getElementById("roommateName");
    const name = input.value.trim();

    if (!name) {
        alert("Please enter a roommate name.");
        return;
    }

    try {
        await api("/roommates", {
            method: "POST",
            body: JSON.stringify({ name })
        });

        input.value = "";
        await refresh();

    } catch (error) {
        alert(error.message);
    }
}

async function loadRoommates() {
    const roommates = await api("/roommates");

    const list = document.getElementById("roommateList");
    const count = document.getElementById("roommateCount");
    const badge = document.getElementById("roommateBadge");

    count.textContent = roommates.length;

    if (badge) {
        badge.textContent = `${roommates.length} Members`;
    }

    if (roommates.length === 0) {
        list.innerHTML = `
            <li class="empty-state">
                No roommates added yet.
            </li>
        `;
        return;
    }

    list.innerHTML = roommates.map(roommate => `
        <li class="list-item">
            <div class="list-item-info">
                <strong>${escapeHTML(roommate.name)}</strong>
                <small>
                    Assigned: ${Number(roommate.assignedCount) || 0}
                    · Completed: ${Number(roommate.completedCount) || 0}
                </small>
            </div>

            <button
                class="delete-btn"
                onclick="deleteRoommate('${roommate._id}')"
                title="Delete roommate"
            >
                Delete
            </button>
        </li>
    `).join("");
}

async function deleteRoommate(id) {
    if (!confirm("Are you sure you want to delete this roommate?")) {
        return;
    }

    try {
        await api(`/roommates/${id}`, {
            method: "DELETE"
        });

        await refresh();

    } catch (error) {
        alert(error.message);
    }
}

// ----------------------------------
// CHORES
// ----------------------------------

async function addChore() {
    const titleInput = document.getElementById("choreTitle");
    const frequencyInput = document.getElementById("frequency");

    const title = titleInput.value.trim();
    const frequency = frequencyInput.value;

    if (!title) {
        alert("Please enter a chore name.");
        return;
    }

    try {
        await api("/chores", {
            method: "POST",
            body: JSON.stringify({
                title,
                frequency
            })
        });

        titleInput.value = "";
        await refresh();

    } catch (error) {
        alert(error.message);
    }
}

async function loadChores() {
    const chores = await api("/chores");

    const list = document.getElementById("choreList");
    const select = document.getElementById("choreSelect");
    const count = document.getElementById("choreCount");
    const badge = document.getElementById("choreBadge");

    const previousSelection = select.value;

    count.textContent = chores.length;

    if (badge) {
        badge.textContent = `${chores.length} Tasks`;
    }

    if (chores.length === 0) {
        list.innerHTML = `
            <li class="empty-state">
                No chores added yet.
            </li>
        `;
    } else {
        list.innerHTML = chores.map(chore => `
            <li class="list-item">
                <div class="list-item-info">
                    <strong>${escapeHTML(chore.title)}</strong>
                    <small>${escapeHTML(chore.frequency)}</small>
                </div>

                <button
                    class="delete-btn"
                    onclick="deleteChore('${chore._id}')"
                    title="Delete chore"
                >
                    Delete
                </button>
            </li>
        `).join("");
    }

    select.innerHTML = `
        <option value="">Select a chore</option>
        ${chores.map(chore => `
            <option value="${chore._id}">
                ${escapeHTML(chore.title)}
            </option>
        `).join("")}
    `;

    // Preserve the selected chore if it still exists.
    if (chores.some(chore => chore._id === previousSelection)) {
        select.value = previousSelection;
    }
}

async function deleteChore(id) {
    if (!confirm("Are you sure you want to delete this chore?")) {
        return;
    }

    try {
        await api(`/chores/${id}`, {
            method: "DELETE"
        });

        await refresh();

    } catch (error) {
        alert(error.message);
    }
}

// ----------------------------------
// ROULETTE SPIN
// ----------------------------------

async function spinWheel() {
    if (spinning) return;

    const choreId = document.getElementById("choreSelect").value;
    const button = document.getElementById("spinButton");
    const wheel = document.getElementById("wheel");
    const resultBox = document.getElementById("result");

    if (!choreId) {
        alert("Please select a chore first.");
        return;
    }

    spinning = true;
    button.disabled = true;
    resultBox.textContent = "The wheel is spinning...";

    try {
        // Backend decides the roommate using the fairness algorithm.
        const result = await api("/assignments/spin", {
            method: "POST",
            body: JSON.stringify({ choreId })
        });

        // Animate the wheel.
        const extraRotation = 1800 + Math.floor(Math.random() * 720);
        rotation += extraRotation;

        wheel.style.transition = "transform 3.2s cubic-bezier(0.15, 0.8, 0.15, 1)";
        wheel.style.transform = `rotate(${rotation}deg)`;

        setTimeout(async () => {
            resultBox.innerHTML = `
                🎉 <strong>${escapeHTML(result.roommate.name)}</strong>
                will do
                <strong>${escapeHTML(result.chore.title)}</strong>!
            `;

            spinning = false;
            button.disabled = false;

            await refresh();

        }, 3200);

    } catch (error) {
        spinning = false;
        button.disabled = false;

        resultBox.textContent = "Unable to spin the wheel. Please try again.";
        alert(error.message);
    }
}

// ----------------------------------
// ASSIGNMENT HISTORY
// ----------------------------------

async function loadHistory() {
    const assignments = await api("/assignments");

    const history = document.getElementById("history");

    const completed = assignments.filter(
        assignment => assignment.status === "Completed"
    ).length;

    const pending = assignments.filter(
        assignment => assignment.status === "Pending"
    ).length;

    document.getElementById("completedCount").textContent = completed;
    document.getElementById("pendingCount").textContent = pending;

    const pendingPill = document.getElementById("pendingPill");

    if (pendingPill) {
        pendingPill.textContent = `${pending} Pending`;
    }

    if (assignments.length === 0) {
        history.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    No assignments yet. Spin the wheel to get started!
                </td>
            </tr>
        `;
        return;
    }

    history.innerHTML = assignments.map(assignment => {
        const roommate = assignment.roommate?.name || "Unknown";
        const chore = assignment.chore?.title || "Unknown";

        const assignedDate = assignment.assignedAt
            ? new Date(assignment.assignedAt).toLocaleDateString()
            : "—";

        const status = assignment.status || "Pending";

        return `
            <tr>
                <td>${escapeHTML(roommate)}</td>

                <td>${escapeHTML(chore)}</td>

                <td>${escapeHTML(assignedDate)}</td>

                <td>
                    <span class="status ${status.toLowerCase()}">
                        ${escapeHTML(status)}
                    </span>
                </td>

                <td>
                    ${
                        status === "Pending"
                            ? `
                                <button
                                    class="complete-btn"
                                    onclick="completeChore('${assignment._id}')"
                                >
                                    Mark Complete
                                </button>
                            `
                            : `<span class="done-label">✓ Done</span>`
                    }
                </td>
            </tr>
        `;
    }).join("");
}

// ----------------------------------
// MARK CHORE AS COMPLETED
// ----------------------------------

async function completeChore(id) {
    try {
        await api(`/assignments/${id}/complete`, {
            method: "PATCH"
        });

        await refresh();

    } catch (error) {
        alert(error.message);
    }
}

// ----------------------------------
// HTML SECURITY HELPER
// ----------------------------------

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// ----------------------------------
// INITIALIZE DASHBOARD
// ----------------------------------

document.addEventListener("DOMContentLoaded", () => {
    refresh();
});
