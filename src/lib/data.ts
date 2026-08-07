import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  FoodRequest,
  Listing,
  ListingWithHotel,
  NotificationRow,
  Profile,
  RequestWithRelations,
} from "./domain";

async function unwrap<T>(p: PromiseLike<{ data: T | null; error: { message: string } | null }>) {
  const { data, error } = await p;
  if (error) throw new Error(error.message);
  return data as T;
}

const LISTING_WITH_HOTEL = "*, profiles:hotel_id(*)";

export const hotelListingsQuery = (hotelId: string) =>
  queryOptions({
    queryKey: ["listings", "hotel", hotelId],
    queryFn: () => {
      if (!hotelId) return Promise.resolve([]);
      return unwrap<Listing[]>(
        supabase
          .from("listings")
          .select("*")
          .eq("hotel_id", hotelId)
          .order("created_at", { ascending: false }),
      );
    },
    enabled: Boolean(hotelId),
  });

export const availableListingsQuery = () =>
  queryOptions({
    queryKey: ["listings", "available"],
    queryFn: () =>
      unwrap<ListingWithHotel[]>(
        supabase
          .from("listings")
          .select(LISTING_WITH_HOTEL)
          .eq("status", "available")
          .order("created_at", { ascending: false }),
      ),
  });

export const allListingsQuery = () =>
  queryOptions({
    queryKey: ["listings", "all"],
    queryFn: () =>
      unwrap<ListingWithHotel[]>(
        supabase
          .from("listings")
          .select(LISTING_WITH_HOTEL)
          .order("created_at", { ascending: false })
          .limit(200),
      ),
  });

export const listingQuery = (id: string) =>
  queryOptions({
    queryKey: ["listing", id],
    queryFn: () => {
      if (!id) return Promise.resolve(null as unknown as ListingWithHotel);
      return unwrap<ListingWithHotel>(
        supabase.from("listings").select(LISTING_WITH_HOTEL).eq("id", id).single(),
      );
    },
    enabled: Boolean(id),
  });

export const myRequestsQuery = (charityId: string) =>
  queryOptions({
    queryKey: ["requests", "charity", charityId],
    queryFn: () => {
      if (!charityId) return Promise.resolve([]);
      return unwrap<RequestWithRelations[]>(
        supabase
          .from("food_requests")
          .select("*, listings(*), hotel:hotel_id(*), charity:charity_id(*)")
          .eq("charity_id", charityId)
          .order("created_at", { ascending: false }),
      );
    },
    enabled: Boolean(charityId),
  });

export const hotelRequestsQuery = (hotelId: string) =>
  queryOptions({
    queryKey: ["requests", "hotel", hotelId],
    queryFn: () => {
      if (!hotelId) return Promise.resolve([]);
      return unwrap<RequestWithRelations[]>(
        supabase
          .from("food_requests")
          .select("*, listings(*), hotel:hotel_id(*), charity:charity_id(*)")
          .eq("hotel_id", hotelId)
          .order("created_at", { ascending: false }),
      );
    },
    enabled: Boolean(hotelId),
  });

export const listingRequestsQuery = (listingId: string) =>
  queryOptions({
    queryKey: ["requests", "listing", listingId],
    queryFn: () => {
      if (!listingId) return Promise.resolve([]);
      return unwrap<RequestWithRelations[]>(
        supabase
          .from("food_requests")
          .select("*, listings(*), hotel:hotel_id(*), charity:charity_id(*)")
          .eq("listing_id", listingId)
          .order("created_at", { ascending: false }),
      );
    },
    enabled: Boolean(listingId),
  });

export const allRequestsQuery = () =>
  queryOptions({
    queryKey: ["requests", "all"],
    queryFn: () =>
      unwrap<RequestWithRelations[]>(
        supabase
          .from("food_requests")
          .select("*, listings(*), hotel:hotel_id(*), charity:charity_id(*)")
          .order("created_at", { ascending: false })
          .limit(200),
      ),
  });

export const favoritesQuery = (userId: string) =>
  queryOptions({
    queryKey: ["favorites", userId],
    queryFn: () => {
      if (!userId) return Promise.resolve([]);
      return unwrap<{ id: string; listing_id: string }[]>(
        supabase.from("favorites").select("id, listing_id").eq("user_id", userId),
      );
    },
    enabled: Boolean(userId),
  });

export const notificationsQuery = (userId: string) =>
  queryOptions({
    queryKey: ["notifications", userId],
    queryFn: () => {
      if (!userId) return Promise.resolve([]);
      return unwrap<NotificationRow[]>(
        supabase
          .from("notifications")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(100),
      );
    },
    enabled: Boolean(userId),
  });

export const allProfilesQuery = () =>
  queryOptions({
    queryKey: ["profiles", "all"],
    queryFn: async () => {
      const [profilesRes, rolesRes, listingsRes, requestsRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("listings").select("hotel_id"),
        supabase.from("food_requests").select("hotel_id, charity_id"),
      ]);

      const profiles = (profilesRes.data ?? []) as Profile[];
      const roles = (rolesRes.data ?? []) as { user_id: string; role: string }[];
      const listings = (listingsRes.data ?? []) as { hotel_id: string }[];
      const requests = (requestsRes.data ?? []) as { hotel_id: string; charity_id: string }[];

      const roleMap = new Map<string, string>();
      roles.forEach((r) => {
        if (r.user_id && r.role) roleMap.set(r.user_id, r.role);
      });

      listings.forEach((l) => {
        if (l.hotel_id && !roleMap.has(l.hotel_id)) roleMap.set(l.hotel_id, "hotel");
      });
      requests.forEach((rq) => {
        if (rq.hotel_id && !roleMap.has(rq.hotel_id)) roleMap.set(rq.hotel_id, "hotel");
        if (rq.charity_id && !roleMap.has(rq.charity_id)) roleMap.set(rq.charity_id, "charity");
      });

      return profiles.map((p) => {
        let role = roleMap.get(p.id) ?? null;

        if (!role) {
          const name = `${p.org_name || ""} ${p.full_name || ""}`.toLowerCase();
          if (
            name.includes("فندق") ||
            name.includes("hôtel") ||
            name.includes("hotel") ||
            name.includes("auberge") ||
            name.includes("resort") ||
            name.includes("بلازا") ||
            name.includes("palace")
          ) {
            role = "hotel";
          } else if (
            name.includes("جمعية") ||
            name.includes("جمعيه") ||
            name.includes("association") ||
            name.includes("خيرية") ||
            name.includes("خيريه") ||
            name.includes("مؤسسة") ||
            name.includes("مؤسسه") ||
            name.includes("الهلال") ||
            name.includes("croissant")
          ) {
            role = "charity";
          }
        }

        return { ...p, role };
      });
    },
  });

export async function notify(input: {
  user_id: string;
  title: string;
  body?: string;
  kind?: string;
  link?: string;
}) {
  await supabase.from("notifications").insert(input);
}

export type { FoodRequest };
