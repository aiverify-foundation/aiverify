Here are some common issues and solutions for problems that users may encounter while using the software.

| Category | Issue | Subscription |
| ---------- | ---------- | ---------- |
| Setup & Installation | Systemctl command is not available if you are using WSL. | We reccomend running the application in a virtual machine. Else, try this fix here: [https://devblogs.microsoft.com/commandline/systemd-support-is-now-available-in-wsl/](https://devblogs.microsoft.com/commandline/systemd-support-is-now-available-in-wsl/) |
| Setup & Installation | MAC and Linux users might encounter issues connecting to mongoDB. | Go to lib/mongodb.mjs and change <br>```const DB_URI = process.env.DB_URI || 'mongodb://aiverify:aiverify@localhost:27017/aiverify'; ``` <br>to<br> ``` const DB_URI = process.env.DB_URI || 'mongodb://aiverify:aiverify@127.0.0.1:27017/aiverify'; ``` |
| Test Run | Test run fails with error: ```There was an error getting algorithm instance (not found)``` | You might have some missing algorithm dependencies. Go to the 'Algorithm' tab for this plugin in the Plugin Manager Page and install any missing required packages. |

