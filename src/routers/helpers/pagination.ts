//надо ли переводить пагинацию на классы    YFLJ

export type PaginatedType = {
  pageNumber: number;
  pageSize: number;
  sortDirection: "asc" | "desc";
  sortBy: string;
  skip: number;
  searchNameTerm?: string;
  searchLoginTerm?: string;
  searchEmailTerm?: string;
};

export type DefaultPagination = {
  pageNumber: number;
  pageSize: number;
  sortBy: string;
  sortDirection: "asc" | "desc";
  skip: number;
};

export type UserPagination = DefaultPagination & {      
  searchLoginTerm?: string;
  searchEmailTerm?: string;
};

export const getPaginationFromQuery = (query: PaginatedType): DefaultPagination => {
  const defaultValues: PaginatedType = {
    pageNumber: 1,
    pageSize: 10,
    sortDirection: "desc",
    sortBy: "createdAt",
    skip: 0,
  };
  if (query.sortBy) {
    defaultValues.sortBy = query.sortBy;
  }

  if (query.sortDirection && query.sortDirection === "asc") {
    defaultValues.sortDirection = query.sortDirection;
  }

  if (
    query.pageNumber &&
    !isNaN(parseInt(query.pageNumber.toString(), 10)) &&    // привел pageNumber к стринге тк ругались типы
    parseInt(query.pageNumber.toString(), 10) > 0   // привел pageNumber к стринге тк ругались типы
  ) {
    defaultValues.pageNumber = parseInt(query.pageNumber.toString(), 10);    // привел pageNumber к стринге тк ругались типы
  }

  if (
    query.pageSize &&
    !isNaN(parseInt(query.pageSize.toString(), 10)) &&   // привел pageNumber к стринге тк ругались типы
    parseInt(query.pageSize.toString(), 10) > 0   // привел pageNumber к стринге тк ругались типы
  ) {
    defaultValues.pageSize = parseInt(query.pageSize.toString(), 10);    // привел pageNumber к стринге тк ругались типы
  }

  if (query.searchNameTerm) {
    defaultValues.searchNameTerm = query.searchNameTerm;
  }

  defaultValues.skip = (defaultValues.pageNumber - 1) * defaultValues.pageSize;

  return defaultValues;
};

export const getDefaultPagination = (query: PaginatedType): DefaultPagination => {   // any не нравится
  const defaultValues: DefaultPagination = {
    sortBy: "createdAt",
    sortDirection: "desc",
    pageNumber: 1,
    pageSize: 10,
    skip: 0,
  };

  if (query.sortBy) {
    defaultValues.sortBy = query.sortBy;
  }

  if (query.sortDirection && query.sortDirection === "asc") {
    defaultValues.sortDirection = query.sortDirection;
  }

  if (query.pageNumber && query.pageNumber > 0) {
    defaultValues.pageNumber = +query.pageNumber;
  }

  if (query.pageSize && query.pageSize > 0) {
    defaultValues.pageSize = +query.pageSize;
  }

  defaultValues.skip = (defaultValues.pageNumber - 1) * defaultValues.pageSize;
  return defaultValues;
};

export const getUsersPagination = (query: PaginatedType): UserPagination => {
  const defaultValues: UserPagination = {
    ...getDefaultPagination(query),
    searchEmailTerm: "",
    searchLoginTerm: "",
  };

  if (query.searchEmailTerm)
    defaultValues.searchEmailTerm = query.searchEmailTerm;
  if (query.searchLoginTerm)
    defaultValues.searchLoginTerm = query.searchLoginTerm;

  return defaultValues;
};
