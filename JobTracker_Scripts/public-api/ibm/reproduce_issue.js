
fetch("https://careers.ibm.com/wd/api/careers/v2/ibm/jobs", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        searchText: "software engineer",
        limit: 20,
        offset: 0
    })
})
    .then(res => {
        console.log("Status:", res.status);
        return res.text();
    })
    .then(text => {
        console.log("Response:", text);
    })
    .catch(err => {
        console.error("Error:", err);
    });
