import css from './Pagination.module.css';
import ReactPaginate from 'react-paginate';

interface PaginationProps {
  totalPages: number;
  page: number;
  onPageChange: (selected: number) => void;
}

const Pagination = ({ totalPages, page, onPageChange }: PaginationProps) => {
  return (
    <ReactPaginate
      pageCount={totalPages}
      forcePage={page - 1}
      onPageChange={({ selected }) => onPageChange(selected + 1)}
      containerClassName={css.pagination}
      pageClassName={css.page}
      pageLinkClassName={css.pageLink}
      previousClassName={css.previous}
      nextClassName={css.next}
      activeClassName={css.selected}
      disabledClassName={css.disabled}
      breakClassName={css.break}
      previousLabel="←"
      nextLabel="→"
      pageRangeDisplayed={3}
      marginPagesDisplayed={1}
    />
  );
};

export default Pagination;
