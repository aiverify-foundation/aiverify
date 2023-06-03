// const months = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Aug", "Nov", "Dec" ];
import moment from 'moment';

export const getReportDate = (props) => {
  if (!props.report)
    return "";
  return moment(props.report.reportDate).format('DD MMM YYYY')
}

export const getReportDateTime = (props) => {
  let datestr = getReportDate(props);
  return moment(props.report.reportDate).format('DD MMM YYYY, hh:mm:SS A')
}