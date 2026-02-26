export interface MockFavorite {
  id: string;
  user_id: string;
  bike_id: string;
  created_at: string;
}

export const mockFavorites: MockFavorite[] = [
  {
    id: "fav-001",
    user_id: "user-001",
    bike_id: "bike-005",
    created_at: "2026-01-15T10:00:00Z",
  },
  {
    id: "fav-002",
    user_id: "user-001",
    bike_id: "bike-006",
    created_at: "2026-01-20T14:30:00Z",
  },
  {
    id: "fav-003",
    user_id: "user-001",
    bike_id: "bike-009",
    created_at: "2026-02-01T09:00:00Z",
  },
];
