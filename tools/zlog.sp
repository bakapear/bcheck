#pragma semicolon 1
#pragma newdecls required

#include <tf2_stocks>
#include <sdkhooks>

public Plugin myinfo = { 
    name = "zLogger",
    author = "pear"
};

enum struct ZData {
    int count;
    float speedo;
    float vel;
    float offs;
}

enum struct ZClient {
    int client;
    float pos[3];
    float ang[3];

    int buttons;
    ArrayList logs;

    float lastCharge;
    int beforeButtons;
    int afterButtons;
    float delay;
    int iters;
    int total;
    char cmd[128];

    void init(int client, int bb, float delay, int ab, int iters, char[] cmd) {
        this.client = client;

        GetClientAbsOrigin(client, this.pos);
        this.ang = view_as<float>({90.0, 0.0, 0.0});

        this.beforeButtons = bb;
        this.afterButtons = ab;
        this.delay = delay;
        this.iters = iters;
        this.total = iters;
        strcopy(this.cmd, 128, cmd);

        this.logs = new ArrayList(sizeof(ZData));

        this.run();
    }

    void destroy() {
        SDKUnhook(this.client, SDKHook_OnTakeDamagePost, OnTakeDamagePost);   
        this.client = 0;
    }

    void run() {
        if(this.client == 0) return;
        this.buttons = 0;
        TeleportEntity(this.client, this.pos, this.ang, view_as<float>({0.0, 0.0, 0.0})); 
        TF2_RegeneratePlayer(this.client);

        if(this.iters-- == 0) this.done();
        else {
            PrintHintText(this.client, "%s\n%i/%i", this.cmd, this.total - this.iters, this.total);
            CreateTimer(0.4, ToBefore, this.client);
        }
    }

    void before() {
        SDKHook(this.client, SDKHook_OnTakeDamagePost, OnTakeDamagePost);
        if(this.delay > 0) {
            this.buttons = this.beforeButtons;
            CreateTimer(this.delay, ToAfter, this.client);
        } else {
            this.buttons = this.afterButtons;
        }
    }

    void after() { this.buttons = this.afterButtons; }

    void done() {
        int total;
        for(int i = 0; i < this.logs.Length; i++) {
            ZData ld; this.logs.GetArray(i, ld);
            char buffer[64]; 
            Format(buffer, sizeof(buffer), "SPEEDO: %f, VEL: %f, OFFS: %f", ld.speedo, ld.vel, ld.offs);
            total += ld.count;
            PrintToConsole(this.client, "%i > %s", ld.count, buffer);
        }
        PrintChat(this.client, "Printed %i logs to console.", total);
        this.destroy();
    }

    void log(float speedo, float vel, float offs) {
        for(int i = 0; i < this.logs.Length; i++) {
            ZData ld; this.logs.GetArray(i, ld); 
            if(ld.speedo == speedo && ld.vel == vel && ld.offs == offs) {
                ld.count++;
                this.logs.SetArray(i, ld);
                return;
            }
        }
        
        ZData ld;
        ld.count = 1;
        ld.speedo = speedo;
        ld.vel = vel;
        ld.offs = offs;
        this.logs.PushArray(ld);
    }
}

ZClient zclients[MAXPLAYERS + 1];

public void OnPluginStart() {
    RegConsoleCmd("sm_zlog", sm_zlog, "Log rocket jump velocities and stuff");
}

public Action sm_zlog(int client, int args) {
    if(zclients[client].client > 0) {
        zclients[client].done();
    } else if(args < 3) {
        PrintChat(client, "Usage:\nsm_zlog <buttons> <delay> <buttons> <iterations>");
    } else {
        int bb = GetButtons(1);
        float delay = GetDelay(2);
        if(delay == -1.0) {
            PrintChat(client, "Invalid delay! Must be at least 0.");
            return Plugin_Handled;
        }
        int ab = GetButtons(3);
        if(
            !(bb & IN_ATTACK) && !(bb & IN_ATTACK2) &&
            !(ab & IN_ATTACK) && !(ab & IN_ATTACK2)
        ) {
            PrintChat(client, "One of the buttons must include an attack input.");
            return Plugin_Handled;
        }
        int iters = GetIterCount(4);
        if(iters == -1) {
            PrintChat(client, "Invalid iteration count! Must be at least 1.");
            return Plugin_Handled;
        }

        char arg1[8]; GetCmdArg(1, arg1, sizeof(arg1));
        char arg2[8]; GetCmdArg(3, arg2, sizeof(arg2));
        char cmd[32];  Format(cmd, sizeof(cmd), "%s > %s", arg1, arg2);
        
        zclients[client].init(client, bb, delay, ab, iters, cmd);
    }
    return Plugin_Handled;
}

public Action OnPlayerRunCmd(int client, int &buttons, int &impulse, float vel[3]) {
    if(zclients[client].client > 0) {
        buttons |= zclients[client].buttons;

        float speed = 400.0;
        if(buttons & IN_FORWARD) vel[0] = speed;
        if(buttons & IN_BACK) vel[0] = -speed;
        if(buttons & IN_MOVERIGHT) vel[1] = speed;
        if(buttons & IN_MOVELEFT) vel[1] = -speed;
        
        float GameTime = GetGameTime();
        int wep = GetEntPropEnt(client, Prop_Data, "m_hActiveWeapon");
        float atk = GetEntPropFloat(wep, Prop_Send, "m_flNextPrimaryAttack");
        float next = ((atk - GameTime) - 0.08) + GameTime;
        SetEntPropFloat(wep, Prop_Send, "m_flNextPrimaryAttack", next);

        char cname[128]; GetEntityClassname(wep, cname, sizeof(cname));
        if(StrEqual(cname, "tf_weapon_particle_cannon")) {
            float charge = GetEntPropFloat(wep, Prop_Send, "m_flChargeBeginTime");
            float chargemod = charge - 4.0;
            if (charge != 0 && zclients[client].lastCharge != chargemod) {
                zclients[client].lastCharge = chargemod;
                SetEntPropFloat(wep, Prop_Send, "m_flChargeBeginTime", chargemod);
            }
            SetEntPropFloat(wep, Prop_Send, "m_flEnergy", 20.0);
        }
    }
}

public void PrintChat(int client, const char[] format, any ...) {
    char buffer[254];
    VFormat(buffer, sizeof(buffer), format, 3);
    PrintToChat(client, "[zLogger] %s", buffer);
}

public int GetButtons(int arg) {
    char str[8]; GetCmdArg(arg, str, sizeof(str));
    int res = 0;
    for(int i = 0; i < sizeof(str); i++) {
        switch(str[i]) {
            case 'F': res |= IN_FORWARD;
            case 'B': res |= IN_BACK;
            case 'L': res |= IN_MOVELEFT;
            case 'R': res |= IN_MOVERIGHT;
            case 'S': res |= IN_ATTACK;
            case 'J': res |= IN_JUMP;
            case 'D': res |= IN_DUCK;
            case 'C': res |= IN_ATTACK2;
        }
    }
    return res;
}

public float GetDelay(int arg) {
    char str[8]; GetCmdArg(arg, str, sizeof(str));
    float res = StringToFloat(str);
    return res >= 0.0 ? res : -1.0;
}

public int GetIterCount(int arg) {
    char str[8]; GetCmdArg(arg, str, sizeof(str));
    int res = StringToInt(str);
    return res > 0 ? res : -1;
}

public void OnTakeDamagePost(int client, int attacker, int inflictor, float damage, int damagetype, int weapon, float force[3], float pos[3]) {
    SDKUnhook(client, SDKHook_OnTakeDamagePost, OnTakeDamagePost);
    float vel[3]; GetEntPropVector(client, Prop_Data, "m_vecVelocity", vel);
    float org[3]; GetEntPropVector(client, Prop_Data, "m_vecOrigin", org);

    zclients[client].buttons &= ~IN_ATTACK;
    zclients[client].buttons &= ~IN_ATTACK2;

    KillRockets(client);

    SetVariantInt(1000);
    AcceptEntityInput(client, "sethealth");
    
    if (vel[2] > 0 && (damagetype & DMG_BLAST) && client == attacker) {
        DataPack dp = new DataPack();
        dp.WriteCell(client);
        dp.WriteFloat(vel[2]);
        dp.WriteFloat(org[2] - zclients[client].pos[2]);

        CreateTimer(0.1, AfterDamage, dp);
    }
}

public Action AfterDamage(Handle timer, DataPack dp) {
    dp.Reset();
    int client = dp.ReadCell();
    float zvel = dp.ReadFloat();
    float offs = dp.ReadFloat();
    
    float vel[3]; GetEntPropVector(client, Prop_Data, "m_vecVelocity", vel);
    float speedo = FloatAbs(SquareRoot(vel[0] * vel[0] + vel[1] * vel[1]));

    zclients[client].log(speedo, zvel, offs);
    zclients[client].run();
}

public void KillRockets(int client) {
    int ent = -1;
    while((ent = FindEntityByClassname(ent, "tf_projectile_rocket")) != -1) {
        if(IsValidEntity(ent) && GetEntPropEnt(ent, Prop_Data, "m_hOwnerEntity") == client) {
            AcceptEntityInput(ent, "kill");
        }
    }
}

public Action ToBefore(Handle timer, int client) { zclients[client].before(); }
public Action ToAfter(Handle timer, int client) { zclients[client].after(); }
