/* =====================================
   1. DONNÉES
===================================== */

const DEFAULT_CLASSES = [
    { id: "4AM", name: "4ème année moyenne", students: [] },
    { id: "4AP", name: "4ème année primaire", students: [] }
];

let classes = loadClasses();
let currentClassId = null;
let currentStudentId = null;

function loadClasses() {
    try {
        const saved = JSON.parse(localStorage.getItem("classes"));

        if (!Array.isArray(saved)) {
            return JSON.parse(JSON.stringify(DEFAULT_CLASSES));
        }

        return saved.map(classe => ({
            ...classe,
            students: (classe.students || []).map(student => ({
                ...student,
                phone: student.phone || "",
                note: student.note || "",
                sessions: student.sessions || [],
                payments: student.payments || []
            }))
        }));

    } catch {
        return JSON.parse(JSON.stringify(DEFAULT_CLASSES));
    }
}

function saveData() {
    localStorage.setItem("classes", JSON.stringify(classes));
}

function createId() {
    return Date.now().toString(36) +
        Math.random().toString(36).slice(2);
}

function currentClass() {
    return classes.find(c => c.id === currentClassId);
}

function currentStudent() {
    return currentClass()?.students.find(
        s => s.id === currentStudentId
    );
}

function localDate() {
    const now = new Date();
    const offset = now.getTimezoneOffset();

    return new Date(now.getTime() - offset * 60000)
        .toISOString().slice(0, 10);
}

/* =====================================
   2. NAVIGATION
===================================== */

function showPage(id) {
    document.querySelectorAll("main section.page")
        .forEach(page => page.hidden = true);

    const page = document.getElementById(id);

    if (page) page.hidden = false;
}

function goHome() {
    currentClassId = null;
    currentStudentId = null;

    showPage("homePage");
    renderClasses();
}

function backToStudents() {
    currentStudentId = null;

    showPage("studentsPage");
    renderStudents();
}

/* =====================================
   3. CLASSES
===================================== */

function renderClasses() {
    const container = document.getElementById("classesList");

    if (!container) return;

    container.innerHTML = "";

    classes.forEach(classe => {
        const card = document.createElement("article");
        card.className = "class-card";

        const title = document.createElement("h3");
        title.textContent = classe.name;

        const count = document.createElement("p");
        count.textContent =
            classe.students.length + " élève(s)";

        const button = document.createElement("button");
        button.textContent = "Ouvrir la classe";

        button.onclick = () => openClass(classe.id);

        card.append(title, count, button);
        container.appendChild(card);
    });
}

function openClass(id) {
    currentClassId = id;

    const classe = currentClass();

    if (!classe) return;

    document.getElementById("classTitle").textContent =
        classe.name;

    showPage("studentsPage");

    const date = document.getElementById("sessionDate");

    if (date && !date.value) {
        date.value = localDate();
    }

    renderStudents();
}

function addClass() {
    showPage("addClassPage");
}

function saveClass() {
    const input = document.getElementById("newClassName");
    const name = input.value.trim();

    if (!name) {
        alert("Écris le nom de la classe.");
        return;
    }

    classes.push({
        id: createId(),
        name: name,
        students: []
    });

    saveData();

    input.value = "";

    goHome();
}

/* =====================================
   4. ÉLÈVES
===================================== */

function addStudent() {
    const classe = currentClass();

    if (!classe) return;

    const number = classe.students.length + 1;

    classe.students.push({
        id: createId(),
        name: "Étudiant " + number,
        phone: "",
        note: "",
        sessions: [],
        payments: []
    });

    saveData();
    renderStudents();
}

function renderStudents() {
    const classe = currentClass();

    const container =
        document.getElementById("studentsList");

    if (!classe || !container) return;

    container.innerHTML = "";

    if (classe.students.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-history";
        empty.textContent = "Aucun élève pour le moment.";

        container.appendChild(empty);
        return;
    }

    classe.students.forEach(student => {
        const row = document.createElement("article");
        row.className = "student-row";

        const info = document.createElement("div");
        info.className = "student-info";

        const name = document.createElement("strong");
        name.textContent = student.name;

        const profile = document.createElement("button");
        profile.textContent = "Voir le profil";

        profile.onclick = () => openStudent(student.id);

        info.append(name, profile);

        const controls = document.createElement("div");
        controls.className = "presence-buttons";

        const choices = [
            ["Présent en groupe", "groupe", "btn-group"],
            ["Présent individuellement", "individuel", "btn-individual"],
            ["Absent", "absent", "btn-absent"]
        ];

        choices.forEach(([label, status, cssClass]) => {
            const button = document.createElement("button");

            button.textContent = label;
            button.className = cssClass;

            button.onclick = () =>
                recordAttendance(student.id, status);

            controls.appendChild(button);
        });

        row.append(info, controls);
        container.appendChild(row);
    });
}

/* =====================================
   5. TARIFS
===================================== */

function calculateSessionPrice(classId, status) {
    if (status === "absent") return 0;

    if (classId === "4AM") {
        return status === "groupe" ? 380 : 500;
    }

    if (classId === "4AP") {
        return 400;
    }

    return 0;
}

/* =====================================
   6. PRÉSENCES
===================================== */

function recordAttendance(studentId, status) {
    const classe = currentClass();

    const student = classe?.students.find(
        s => s.id === studentId
    );

    if (!student) return;

    const date =
        document.getElementById("sessionDate").value ||
        localDate();

    const subject =
        document.getElementById("subjectSelect").value ||
        "Non précisée";

    const index = student.sessions.findIndex(
        session =>
            session.date === date &&
            session.subject === subject
    );

    const session = {
        id: index >= 0
            ? student.sessions[index].id
            : createId(),

        date: date,
        subject: subject,
        status: status,

        amount: calculateSessionPrice(
            classe.id,
            status
        )
    };

    if (index >= 0) {
        student.sessions[index] = session;
    } else {
        student.sessions.push(session);
    }

    saveData();

    renderStudents();

    if (currentStudentId === studentId) {
        renderStudentProfile();
    }
}

/* =====================================
   7. PROFIL
===================================== */

function openStudent(id) {
    currentStudentId = id;

    const student = currentStudent();

    if (!student) return;

    showPage("studentPage");

    renderStudentProfile();
}

function editStudent() {
    const student = currentStudent();

    if (!student) return;

    document.getElementById("editName").value =
        student.name;

    document.getElementById("editPhone").value =
        student.phone || "";

    document.getElementById("editNote").value =
        student.note || "";

    document.getElementById("studentDialog").showModal();
}

function saveStudentInfo(event) {
    event.preventDefault();

    const student = currentStudent();

    if (!student) return;

    const name =
        document.getElementById("editName").value.trim();

    if (!name) {
        alert("Le nom est obligatoire.");
        return;
    }

    student.name = name;

    student.phone =
        document.getElementById("editPhone").value.trim();

    student.note =
        document.getElementById("editNote").value.trim();

    saveData();

    document.getElementById("studentDialog").close();

    renderStudentProfile();
    renderStudents();
}

function deleteStudent() {
    const classe = currentClass();

    if (!classe) return;

    if (!confirm(
        "Supprimer cet élève et tout son historique ?"
    )) return;

    classe.students = classe.students.filter(
        student => student.id !== currentStudentId
    );

    currentStudentId = null;

    saveData();

    backToStudents();
}

/* =====================================
   8. CALCUL DES MONTANTS
===================================== */

function calculateTotal(sessions) {
    const classe = currentClass();

    if (!classe) return 0;

    if (classe.id === "4AM") {
        const groupCount = sessions.filter(
            s => s.status === "groupe"
        ).length;

        const individualTotal = sessions
            .filter(s => s.status === "individuel")
            .reduce(
                (sum, s) => sum + Number(s.amount || 0),
                0
            );

        const groupTotal =
            Math.floor(groupCount / 5) * 2000 +
            (groupCount % 5) * 380;

        return groupTotal + individualTotal;
    }

    return sessions.reduce(
        (sum, s) => sum + Number(s.amount || 0),
        0
    );
}

function getSelectedMonth() {
    const input =
        document.getElementById("monthSelect");

    if (!input.value) {
        input.value = localDate().slice(0, 7);
    }

    return input.value;
}

/* =====================================
   9. AFFICHAGE DU PROFIL
===================================== */

function renderStudentProfile() {
    const student = currentStudent();
    const classe = currentClass();

    if (!student || !classe) return;

    document.getElementById("studentName").textContent =
        student.name;

    document.getElementById("studentClass").textContent =
        classe.name;

    document.getElementById("studentPhone").textContent =
        student.phone || "Non renseigné";

    document.getElementById("studentNote").textContent =
        student.note || "Aucune note pour le moment.";

    const month = getSelectedMonth();

    const sessions = student.sessions.filter(
        s => s.date.startsWith(month)
    );

    const attended = sessions.filter(
        s => s.status !== "absent"
    ).length;

    document.getElementById("sessionCount").textContent =
        attended;

    document.getElementById("sessionProgress").style.width =
        Math.min(attended / 8 * 100, 100) + "%";

    const total = calculateTotal(sessions);

    const paid = student.payments
        .filter(p => p.month === month)
        .reduce(
            (sum, p) => sum + Number(p.amount || 0),
            0
        );

    const remaining = Math.max(0, total - paid);

    document.getElementById("amountDue").textContent =
        remaining + " DA";

    const status =
        document.getElementById("paymentStatus");

    if (total === 0) {
        status.textContent = "Aucune séance facturée";
        status.className = "payment-pill";
    } else if (remaining === 0) {
        status.textContent = "Payé";
        status.className = "payment-pill paid";
    } else {
        status.textContent =
            paid > 0 ? "Paiement partiel" : "Non payé";

        status.className = "payment-pill";
    }

    renderMonthlyHistory(sessions);
}

/* =====================================
   10. HISTORIQUE
===================================== */

function renderMonthlyHistory(sessions) {
    const container =
        document.getElementById("monthlyHistory");

    const summary =
        document.getElementById("monthlySummary");

    container.innerHTML = "";
    summary.innerHTML = "";

    const groupCount = sessions.filter(
        s => s.status === "groupe"
    ).length;

    const individualCount = sessions.filter(
        s => s.status === "individuel"
    ).length;

    const absentCount = sessions.filter(
        s => s.status === "absent"
    ).length;

    const total = calculateTotal(sessions);

    [
        groupCount + " séance(s) en groupe",
        individualCount + " séance(s) individuelle(s)",
        absentCount + " absence(s)",
        "Total : " + total + " DA"
    ].forEach(text => {
        const chip = document.createElement("span");

        chip.className = "summary-chip";
        chip.textContent = text;

        summary.appendChild(chip);
    });

    if (sessions.length === 0) {
        const empty = document.createElement("div");

        empty.className = "empty-history";
        empty.textContent =
            "Aucune séance enregistrée pour ce mois.";

        container.appendChild(empty);
        return;
    }

    [...sessions]
        .sort((a, b) => b.date.localeCompare(a.date))
        .forEach(session => {

            const row = document.createElement("div");
            row.className = "history-item";

            const date = document.createElement("span");
            date.textContent = session.date;

            const subject = document.createElement("span");
            subject.textContent = session.subject;

            const status = document.createElement("span");
            status.className = "session-status";

            const labels = {
                groupe: "Présent en groupe",
                individuel: "Présent individuellement",
                absent: "Absent"
            };

            status.textContent = labels[session.status];

            const price = document.createElement("strong");
            price.className = "session-price";
            price.textContent = session.amount + " DA";

            const remove = document.createElement("button");
            remove.className = "delete-session";
            remove.textContent = "Supprimer";

            remove.onclick = () =>
                deleteSession(session.id);

            row.append(date, subject, status, price, remove);

            container.appendChild(row);
        });
}

/* SUPPRIMER UNE SEULE SÉANCE */

function deleteSession(sessionId) {
    const student = currentStudent();

    if (!student) return;

    if (!confirm(
        "Veux-tu vraiment supprimer cette séance ? Le montant sera recalculé."
    )) return;

    student.sessions = student.sessions.filter(
        session => session.id !== sessionId
    );

    saveData();

    renderStudentProfile();
    renderStudents();
}

/* =====================================
   11. PAIEMENTS
===================================== */

function markAsPaid() {
    const student = currentStudent();

    if (!student) return;

    const month = getSelectedMonth();

    const sessions = student.sessions.filter(
        s => s.date.startsWith(month)
    );

    const total = calculateTotal(sessions);

    const alreadyPaid = student.payments
        .filter(p => p.month === month)
        .reduce(
            (sum, p) => sum + Number(p.amount || 0),
            0
        );

    const remaining = Math.max(
        0,
        total - alreadyPaid
    );

    if (remaining <= 0) {
        alert("Aucun montant restant à payer.");
        return;
    }

    student.payments.push({
        id: createId(),
        month: month,
        amount: remaining,
        date: localDate()
    });

    saveData();
    renderStudentProfile();

    alert("Paiement enregistré.");
}

function markAsUnpaid() {
    const student = currentStudent();

    if (!student) return;

    const month = getSelectedMonth();

    const payments = student.payments.filter(
        p => p.month === month
    );

    if (payments.length === 0) {
        alert("Aucun paiement enregistré pour ce mois.");
        return;
    }

    if (!confirm(
        "Annuler les paiements de ce mois ?"
    )) return;

    student.payments = student.payments.filter(
        p => p.month !== month
    );

    saveData();
    renderStudentProfile();

    alert("Paiement annulé.");
}

/* =====================================
   12. DÉMARRAGE
===================================== */

document.addEventListener("DOMContentLoaded", () => {
    renderClasses();

    const dateInput =
        document.getElementById("sessionDate");

    if (dateInput) {
        dateInput.value = localDate();
    }

    const monthInput =
        document.getElementById("monthSelect");

    if (monthInput) {
        monthInput.value = localDate().slice(0, 7);

        monthInput.addEventListener(
            "change",
            renderStudentProfile
        );
    }

    document.getElementById("studentForm")
        .addEventListener("submit", saveStudentInfo);
});

