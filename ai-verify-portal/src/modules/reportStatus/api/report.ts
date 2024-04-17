import { gql } from '@apollo/client';
import graphqlClient from 'src/lib/graphqlClient';
import { Report } from 'src/types/project.interface';

const GET_REPORT = gql`
  query Query($projectID: ObjectID!) {
    report(projectID: $projectID) {
      projectID
      status
      timeStart
      timeTaken
      totalTestTimeTaken
      tests {
        algorithmGID
        algorithm {
          gid
          name
          description
        }
        testArguments
        status
        progress
        timeStart
        timeTaken
        output
        errorMessages {
          id
          description
        }
      }
    }
  }
`;
export async function getReport(projectID: string): Promise<Report> {
  const client = graphqlClient();
  const { data } = await client.query({
    query: GET_REPORT,
    variables: {
      projectID,
    },
  });
  return data.report;
}
