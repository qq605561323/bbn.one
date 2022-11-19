import { Drop } from "./RESTSpec.ts";

export type TableData = {
    Id: string;
    Title?: string;
    PrimaryGenre?: string;
    SecondaryGenre?: string;
    Artists?: string;
    Country?: string;
    Explicit?: boolean;
    Year?: number;
};

export type ViewState = {
    list: Drop[];
    reviews: Drop[];
    type: Drop[ "type" ];
};
