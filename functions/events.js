const axios = require("axios").default;

exports.events = (req, res) => {
    var year = parseInt(req.query.year) || new Date().getFullYear();
  
    axios
      .get("https://o-l.ch/cgi-bin/fixtures", {
        params: { mode: "results", year, json: 1 },
      })
      .then((response) => {
        if (response.status !== 200) {
          res.status(500);
          res.json({ error: "backend server reported a problem" });
          return;
        }
  
        const events = response.data["ResultLists"]
          .filter((entry) => entry["ResultType"] === 0)
          .map((entry) => {
            const row = {
              id: entry["ResultListID"],
              name: entry["EventName"],
              date: entry["EventDate"],
              map: entry["EventMap"],
              club: entry["EventClub"],
              source: "solv",
            };
            if (entry["SubTitle"]) {
              row.subtitle = entry["SubTitle"];
            }
            return row;
          });
  
        events.sort((e1, e2) => e2.date.localeCompare(e1.date));
  
        res.set("Access-Control-Allow-Origin", "*");
        res.set("Cache-Control", "max-age=60");
        res.json({ events: events });
      })
      .catch((reason) => {
        res.status(500);
        res.json({ message: "internal error: " + reason });
      });
  };