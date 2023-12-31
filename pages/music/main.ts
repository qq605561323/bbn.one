import { MaterialIcons, Vertical, View, WebGen } from "webgen/mod.ts";
import '../../assets/css/main.css';
import '../../assets/css/music.css';
import { DynaNavigation } from "../../components/nav.ts";
import { RegisterAuthRefresh, renewAccessTokenIfNeeded } from "../manager/helper.ts";
import { changeThemeColor } from "../manager/misc/common.ts";
import { refreshState } from "./loading.ts";
import { state } from "./state.ts";
import { musicMenu } from "./views/menu.ts";

await RegisterAuthRefresh();
WebGen({
    icon: new MaterialIcons(),
    events: {
        themeChanged: changeThemeColor()
    }
});

View(() => Vertical(...DynaNavigation("Music"), musicMenu))
    .appendOn(document.body);

// make sure we are safe then we start loading.
renewAccessTokenIfNeeded()
    .then(() => refreshState())
    .then(() => state.loaded = true);
