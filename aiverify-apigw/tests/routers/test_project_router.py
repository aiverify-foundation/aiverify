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


class TestReadProject:
    def test_read_project_success(self, test_client, mock_projects):
        project = mock_projects[0]

        response = test_client.get(f"/projects/{project.id}")
        assert response.status_code == 200
        assert response.json()["projectInfo"]["name"] == project.name

    def test_read_project_not_found(self, test_client):
        response = test_client.get("/projects/1234")
        assert response.status_code == 404


class TestUpdateProject:
    def test_update_project_success(self, test_client, mock_projects):
        project = mock_projects[0]

        update_data = {
            "projectInfo": {
                "name": "Updated Project",
                "description": "Updated Description",
                "reportTitle": "Updated Report",
                "company": "Updated Company"
            },
            "testModelId": None,
            "inputBlocks": [],
            "testResults": [],
            "globalVars": [],
            "pages": []
        }
        response = test_client.put(f"/projects/{project.id}", json=update_data)
        assert response.status_code == 200
        assert response.json()["projectInfo"]["name"] == update_data["projectInfo"]["name"]

    def test_update_project_not_found(self, test_client):
        update_data = {
            "projectInfo": {
                "name": "Updated Project",
                "description": "Updated Description",
                "reportTitle": "Updated Report",
                "company": "Updated Company"
            }
        }
        response = test_client.put("/projects/1234", json=update_data)
        assert response.status_code == 404


class TestPatchUpdateProject:
    def test_patch_update_project_success(self, test_client, mock_projects):
        project = mock_projects[0]

        patch_data = {
            "projectInfo": {
                "name": "Patched Project"
            },
        }
        response = test_client.patch(f"/projects/projects/{project.id}", json=patch_data)
        assert response.status_code == 200
        assert response.json()["projectInfo"]["name"] == patch_data["projectInfo"]["name"]

    def test_patch_update_project_not_found(self, test_client):
        patch_data = {
            "projectInfo": {
                "name": "Patched Project"
            }
        }
        response = test_client.patch("/projects/projects/1234", json=patch_data)
        assert response.status_code == 404


class TestDeleteProject:
    def test_delete_project_success(self, test_client, mock_projects):
        project = mock_projects[0]

        response = test_client.delete(f"/projects/projects/{project.id}")
        assert response.status_code == 200
        assert response.json() == project.id

    def test_delete_project_not_found(self, test_client):
        response = test_client.delete("/projects/projects/1234")
        assert response.status_code == 404


class TestSaveProjectAsTemplate:
    def test_save_project_as_template_success(self, test_client, mock_projects):
        project = mock_projects[0]

        template_data = {
            "name": "New Template",
            "description": "Template Description"
        }
        response = test_client.post(f"/projects/saveProjectAsTemplate/{project.id}", json=template_data)
        assert response.status_code == 200
        assert response.json()["projectInfo"]["name"] == template_data["name"]

    def test_save_project_as_template_not_found(self, test_client):
        template_data = {
            "name": "New Template",
            "description": "Template Description"
        }
        response = test_client.post("/projects/saveProjectAsTemplate/1234", json=template_data)
        assert response.status_code == 404
