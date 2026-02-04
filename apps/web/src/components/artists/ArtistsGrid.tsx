"use client";

import * as React from "react";
import { ArtistGridCard } from "./ArtistGridCard";

const artists = [
  {
    name: "Ayanda Khumalo",
    role: "Photographer",
    rating: 4.9,
    reviews: 218,
    location: "Cape Town",
    price: "From R2,500",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Thabo Dlamini",
    role: "Videographer",
    rating: 4.8,
    reviews: 164,
    location: "Johannesburg",
    price: "From R4,200",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Mara Jacobs",
    role: "Creative Director",
    rating: 4.7,
    reviews: 132,
    location: "Pretoria",
    price: "From R3,100",
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Neo Maseko",
    role: "Event Photographer",
    rating: 4.9,
    reviews: 201,
    location: "Durban",
    price: "From R2,100",
    image:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Kiana Suleiman",
    role: "Brand Designer",
    rating: 4.6,
    reviews: 98,
    location: "Cape Town",
    price: "From R1,800",
    image:
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Sipho Ndlovu",
    role: "Drone Operator",
    rating: 4.8,
    reviews: 144,
    location: "Johannesburg",
    price: "From R3,600",
    image:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=900&q=80",
  },
];

export const ArtistsGrid = () => {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 text-white">
      {artists.map((artist) => (
        <ArtistGridCard key={artist.name} artist={artist} />
      ))}
    </div>
  );
};
