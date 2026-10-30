"use client";

import dynamic from "next/dynamic";
import { Component, type ReactNode } from "react";
import { MapView, type MapLandmark, type MapPin } from "./map-view";

type Props = { pins: MapPin[]; landmarks?: MapLandmark[]; className?: string; focus?: { viewKm: number; areaKm: number } };

/** MapLibre needs window and WebGL, so it only loads in the browser. */
const SearchMap = dynamic(() => import("./search-map"), {
  ssr: false,
  loading: () => <div aria-hidden className="size-full animate-pulse bg-[#f2f0eb]" />,
});

/** Falls back to the sketch map when the browser cannot start MapLibre (no WebGL, blocked tiles script...). */
class Fallback extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function SearchMapLazy({ pins, landmarks, className, focus }: Props) {
  return (
    <div className={className}>
      <Fallback fallback={<MapView pins={pins} landmarks={landmarks} fit className="size-full" />}>
        <SearchMap pins={pins} landmarks={landmarks} focus={focus} className="size-full" />
      </Fallback>
    </div>
  );
}
