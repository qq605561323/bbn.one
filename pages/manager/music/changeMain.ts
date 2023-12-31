import { API } from "shared";
import { Entry, Grid, Horizontal, Page, PlainText, Spacer, Vertical, Wizard } from "webgen/mod.ts";
import { Drop, DropType } from "../../../spec/music.ts";
import { DropTypeToText } from "../../music/views/list.ts";
import { permCheck, showPreviewImage } from "../helper.ts";
import { ActionBar } from "../misc/actionbar.ts";
import { changePage } from "../misc/common.ts";
import { DownloadDrop } from "../misc/drop.ts";
import { EditViewState } from "./types.ts";

export function ChangeMain(data: Drop, update: (data: Partial<EditViewState>) => void) {
    return Wizard({
        submitAction: () => { },
    }, () => [
        Page({}, _ => [
            Grid(
                showPreviewImage(data)
            )
                .setEvenColumns(1, "10rem")
                .addClass("limited-width")
                .setMargin("3rem auto -3rem"),
            ActionBar(data.title ?? "(no title)"),
            Horizontal(
                PlainText(DropTypeToText(data.type)),
                Spacer()
            ).addClass("limited-width").setMargin("-1rem auto 2rem"),
            Vertical(
                Permissions.canEdit(data) ? [
                    Entry({ title: "Drop", subtitle: "Change Title, Release Date, ..." }).addClass("limited-width").onClick(changePage(update, "edit-drop")),
                    Entry({ title: "Songs", subtitle: "Move Songs, Remove Songs, Add Songs, ...", }).addClass("limited-width").onClick(changePage(update, "edit-songs")),
                    // Entry({}"Additional Data", "Change Release Date/Time, Store, Regions, ..."),
                ] : null,
                // TODO: Add Read-Only Mode for Drop and Songs

                Entry({ title: "Export", subtitle: "Download your complete Drop with every Song" }).addClass("limited-width").onClick(() => DownloadDrop(data)),

                !Permissions.canCancelReview(data) ? null :
                    Entry({ title: "Cancel Review", subtitle: "Need to change Something? Cancel it now" }).addClass("limited-width").onPromiseClick(async () => {
                        await API.music(API.getToken()).id(data._id).type.post(DropType.Private);
                        location.reload();
                    }),
                !Permissions.canSubmit(data) ? null :
                    Entry({ title: "Publish", subtitle: "Submit your Drop for Approval" }).addClass("limited-width").onPromiseClick(async () => {
                        await API.music(API.getToken()).id(data._id).type.post(DropType.UnderReview);
                        location.reload();
                    }),

                !Permissions.canTakedown(data) ? null :
                    Entry({ title: "Takedown", subtitle: "Completely Takedown your Drop" }).addClass("limited-width").onPromiseClick(async () => {
                        await API.music(API.getToken()).id(data._id).type.post(DropType.Private);
                        location.reload();
                    }).addClass("entry-alert"),

            )
                .setMargin("0 0 22px")
                .setGap("22px")
        ])
    ]
    );
}

const Permissions = {
    canTakedown: (drop: Drop) => drop.type == "PUBLISHED",
    canSubmit: (drop: Drop) => (<Drop[ "type" ][]>[ "UNSUBMITTED", "PRIVATE" ]).includes(drop.type),
    canEdit: (drop: Drop) => (drop.type == "PRIVATE" || drop.type == "UNSUBMITTED") || permCheck("/bbn/manage/drops"),
    canCancelReview: (drop: Drop) => drop.type == "UNDER_REVIEW"
};