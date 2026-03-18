import api from "./api";

export const bookService = {
  search:     (query, page = 1) => api.get("/books/search", { params: { q: query, page } }),
  getById:    (id)              => api.get(`/books/${id}`),
  getContent: (id)              => api.get(`/books/${id}/content`),
};
