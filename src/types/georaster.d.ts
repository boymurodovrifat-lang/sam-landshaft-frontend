declare module 'georaster' {
  export interface GetValuesOptions {
    left: number;
    right: number;
    top: number;
    bottom: number;
    width?: number;
    height?: number;
    resampleMethod?: string;
  }

  export interface Georaster {
    values: number[][][];
    width: number;
    height: number;
    pixelWidth: number;
    pixelHeight: number;
    xmin: number;
    xmax: number;
    ymin: number;
    ymax: number;
    noDataValue: number | null;
    projection: number;
    numberOfRasters: number;
    mins?: number[];
    maxs?: number[];
    ranges?: number[];
    getValues?: (options: GetValuesOptions) => Promise<(number | null)[][][]>;
  }

  export default function parseGeoraster(
    input: string | ArrayBuffer | Uint8Array | object,
  ): Promise<Georaster>;
}

declare module 'georaster-layer-for-leaflet' {
  import type { Layer, LayerOptions } from 'leaflet';
  import type { Georaster } from 'georaster';

  export interface GeoRasterLayerOptions extends LayerOptions {
    georaster: Georaster;
    georasters?: Georaster[];
    opacity?: number;
    resolution?: number;
    debugLevel?: number;
    caching?: boolean;
    pixelValuesToColorFn?: (values: number[]) => string | null;
  }

  export default class GeoRasterLayer extends Layer {
    constructor(options: GeoRasterLayerOptions);
    setOpacity(opacity: number): void;
    clearCache(): void;
  }
}
