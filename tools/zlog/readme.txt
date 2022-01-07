1. > node genConfig.js
2. Put zlog.cfg in your server config files
3. Start server

# Client
4. Join server & spawn as Soldier with primary equipped
5. con_logfile zlog_<launcher>.log

# Server
6. sm_zclient <name of player>
7. exec zlog

# Client
8. Tab back into the game for best results
9. Once it finished do con_logfile "" to finish writing to log
