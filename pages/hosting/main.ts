import { MaterialIcons, Vertical, View, WebGen } from "webgen/mod.ts";
import { RegisterAuthRefresh, permCheck, renewAccessTokenIfNeeded } from "../manager/helper.ts";
import { DynaNavigation } from "../../components/nav.ts";
import '../../assets/css/main.css';
import '../../assets/css/hosting.css';
import { changeThemeColor } from "../manager/misc/common.ts";
import { hostingMenu } from "./views/menu.ts";
import { state } from "./data.ts";
import { pulling, refreshState } from "./loading.ts";
import { migrationDialog } from "./views/details.ts";

await RegisterAuthRefresh();



WebGen({
    icon: new MaterialIcons(),
    events: {
        themeChanged: changeThemeColor()
    }
});

View(() => Vertical(...DynaNavigation("Hosting"), hostingMenu())).appendOn(document.body);

renewAccessTokenIfNeeded()
    .then(() => refreshState())
    .then(() => pulling())
    .then(() => state.loaded = true)
    .then(() => new URLSearchParams(location.search).has("migrated") ? migrationDialog() : null);