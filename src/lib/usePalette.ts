"use client";
import { useEffect, useState } from "react";
import { Vibrant } from "node-vibrant/browser";

export interface PaletteColors {
    lightMuted: string;
    lightVibrant: string;
    vibrant: string;
    muted: string;
    darkVibrant: string;
    darkMuted: string;
}

export function useVibrantPalette(imageSlug: string): PaletteColors {
    // Set default values (white)
    const [paletteColors, setPaletteColors] = useState<PaletteColors>({
        lightMuted: "#ffffff",
        lightVibrant: "#ffffff",
        vibrant: "#ffffff",
        muted: "#ffffff",
        darkVibrant: "#ffffff",
        darkMuted: "#ffffff",
    });

    useEffect(() => {
        Vibrant.from(imageSlug)
            .getPalette()
            .then((palette) => {
                setPaletteColors({
                    lightMuted: palette.LightMuted?.hex ?? "#ffffff",
                    lightVibrant: palette.LightVibrant?.hex ?? "#ffffff",
                    vibrant: palette.Vibrant?.hex ?? "#ffffff",
                    muted: palette.Muted?.hex ?? "#ffffff",
                    darkVibrant: palette.DarkVibrant?.hex ?? "#ffffff",
                    darkMuted: palette.DarkMuted?.hex ?? "#ffffff",
                });
            })
            .catch((error) => {
                console.error("Error extracting palette:", error);
            });
    }, [imageSlug]);

    return paletteColors;
}
