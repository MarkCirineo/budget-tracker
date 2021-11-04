let db;
let budgetVersion;

const request = indexedDB.open("BudgetDB", budgetVersion || 21);

request.onupgradeneeded = e => {
    console.log("Upgrade need in IndexDB");

    const { oldVersion } = e;
    const newVersion = e.newVersion || db.version;

    console.log(`DB Updated from version ${oldVersion} to ${newVersion}`);

    db = e.target.result;

    if (db.objectStoreNames.length === 0) {
        db.createObjectStore("BudgetStore", { autoIncrement: true });
    }
};

request.onerror = e => {
    console.log(e.target.errorCode);
};


const checkDatabase = () => {
    console.log("Checking db");

    let transaction = db.transaction(["BudgetStore"], "readwrite");

    const store = transaction.objectStore("BudgetStore");

    const getAll = store.getAll();

    getAll.onsuccess = () => {
        fetch("/api/transaction/bulk", {
            method: "POST",
            body: JSON.stringify(getAll.result),
            headers: {
                Accept: "application/json, text/plain, */*",
                "Content-Type": "application/json",
            },
        })
            .then(response => response.json())
            .then(res => {
                if (res.length !== 0) {
                    transaction = db.transaction(["BudgetStore"], "readwrite");
                    const currentStore = transaction.objectStore("BudgetStore");

                    currentStore.clear();
                    console.log("Store cleared");
                }
            });
    };
}

request.onsuccess = e => {
    console.log("Success");
    db = e.target.result;

    if (navigator.onLine) {
        checkDatabase();
    }
};

const saveRecord = record => {
    console.log("Saving record");

    const transaction = db.transaction(["BudgetStore"], "readwrite");
    const store = transaction.objectStore("BudgetStore");

    store.add(record);
}

window.addEventListener("online", checkDatabase);