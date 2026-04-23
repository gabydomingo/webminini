// src/types/index.ts

export interface Property {
    id: string;
    title: string;
    description: string;
    price: number | null;
    currency: string;
    operation_type: string;
    property_type: string;
    provincia: string;
    location: string;
    localidad: string;
    latitude: number | null;
    longitude: number | null;
    bedrooms: number;
    bathrooms: number;
    environments: number;
    features: string[] | string;
    status: string;
    images: string[];
    created_at: string;
}