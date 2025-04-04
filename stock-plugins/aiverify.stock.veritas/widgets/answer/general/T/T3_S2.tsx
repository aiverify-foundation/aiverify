import React from "react";

const T3_S2 = ({ props, data }) => {
  return (
    <div>
      <div>
        The extent to which such transparency is needed, and the audience for
        the same, will be determined by the materiality of the AIDA use case.
        Different audiences will require different levels of technical detail
        from the explanations. The following transparency requirements applying
        to different audiences serve as an example.
      </div>

      <div>
        <table>
          <tr>
            <th>Transparency</th>
            <th>Category</th>
            <th>Requirements</th>
          </tr>
          <tr>
            <th>Data scientists, developers, technology teams</th>
            <td>AIDA system developer</td>
            <td>
              Fairness/explainability metrics/ transparency reports including
              various metrics for fairness/ explainability/ etc.
            </td>
          </tr>
          <tr>
            <th>Frontline staff</th>
            <td>AIDA users</td>
            <td>Transparency reports/dashboards in simple, clear language</td>
          </tr>
          <tr>
            <th>BAU owners</th>
            <td>AIDA users</td>
            <td>
              Transparency reports/ dashboards including various metrics for
              fairness / explainability /etc.
            </td>
          </tr>
          <tr>
            <th>Model validation group</th>
            <td>AIDA validators</td>
            <td>Fairness/explainability/ performance metrics</td>
          </tr>
          <tr>
            <th>Second line and governance</th>
            <td>AIDA reviewers/approvers</td>
            <td>AI review checklist/AI controls implementation</td>
          </tr>
        </table>
      </div>
    </div>
  );
};

export default T3_S2;
