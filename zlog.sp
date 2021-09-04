#pragma semicolon 1
#pragma newdecls required

#include <sdkhooks>
#include <sourcemod>

public Plugin myinfo = { name = "zvel logger" };

public void OnPluginStart() {
	RegConsoleCmd("sm_zlog", sm_zlog);
}

public void OnPluginEnd() {
	for (int i = 1; i <= MaxClients; i++) { if (IsValidEntity(i))SDKUnhook(i, SDKHook_OnTakeDamagePost, OnTakeDamagePost); }
}

bool LOGGERS[MAXPLAYERS + 1];

public Action sm_zlog(int client, int args) {
	if (LOGGERS[client]) {
		LOGGERS[client] = false;
		ReplyToCommand(client, "[zlog] Disabled logging");
		SDKUnhook(client, SDKHook_OnTakeDamagePost, OnTakeDamagePost);
	} else {
		LOGGERS[client] = true;
		ReplyToCommand(client, "[zlog] Enabled logging");
		SDKHook(client, SDKHook_OnTakeDamagePost, OnTakeDamagePost);
	}
}

public void OnTakeDamagePost(int victim, int attacker, int inflictor, float damage, int damagetype, int weapon, float force[3], float pos[3]) {
	float vel[3]; GetEntPropVector(victim, Prop_Data, "m_vecVelocity", vel);
	if (vel[2] > 0) PrintToChat(victim, "%f", vel[2]);
}
