import pytest
import json
# from aiverify_apigw.models import ProjectModel, ProjectTemplateModel, TestModelModel, InputBlockDataModel, TestResultModel
# from aiverify_apigw.schemas import ProjectOutput, ProjectInformation, ProjectInput, ProjectPatchInput, ProjectTemplateOutput

class TestGetAllProjects:
    def test_get_all_projects_success(self, test_client, mock_projects):
        response = test_client.get("/projects/")
        assert response.status_code == 200
        projects = response.json()
        assert len(projects) == len(mock_projects)
        for project in projects:
            mock = next((mock for mock in mock_projects if mock.id == project["id"]), None)
            assert mock is not None
            assert project["projectInfo"]["name"] == mock.name



class TestCreateProject:
    def test_create_project_success(self, test_client, mock_project_template):
        template = mock_project_template
        project_data = {
            "name": "New Project",
            "description": "Project Description",
            "reportTitle": "Report Title",
            "company": "Company"
        }
        response = test_client.post(f"/projects/?templateId={template.id}", json=project_data)
        assert response.status_code == 200
        response_obj = response.json()
        assert response_obj["projectInfo"]["name"] == project_data["name"]
        assert response_obj["templateId"] == template.id

    def test_create_project_template_not_found(self, test_client):
        project_data = {
            "name": "New Project",
            "description": "Project Description",
            "reportTitle": "Report Title",
            "company": "Company"
        }
        response = test_client.post("/projects/?templateId=1234", json=project_data)
        assert response.status_code == 400

    def test_create_project_without_template_success(self, test_client):
        # Mock the database query to return None for the template
        project_data = {
            "name": "New Project",
            "description": "Project Description",
            "reportTitle": "Report Title",
            "company": "Company"
        }
        response = test_client.post("/projects/", json=project_data)
        assert response.status_code == 200
        assert response.json()["projectInfo"]["name"] == project_data["name"]

