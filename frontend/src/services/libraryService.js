import api from "./api";

export const libraryService = {
  getAll:         (params)          => api.get("/library/books", { params }),
  addBook:        (data)            => api.post("/library/books", data),
  removeBook:     (bookId)          => api.delete(`/library/books/${bookId}`),
  toggleFavorite: (bookId)          => api.put(`/library/books/${bookId}/favorite`),
  updateStatus:   (bookId, status)  => api.put(`/library/books/${bookId}/status`, { status }),
};
