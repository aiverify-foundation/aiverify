import pytest
import json


class TestGetAllProjectTemplates:
    def test_get_all_project_templates_success(self, test_client, mock_project_template):
        response = test_client.get("/project_templates/")
        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["projectInfo"]["name"] == mock_project_template.name


class TestCreateProjectTemplate:
    def test_create_project_template_success(self, test_client):
        template_data = {
            "projectInfo": {
                "name": "New Template",
                "description": "Template Description"
            },
            "globalVars": [],
            "pages": []
        }
        response = test_client.post("/project_templates/", json=template_data)
        assert response.status_code == 200
        assert response.json()["projectInfo"]["name"] == template_data["projectInfo"]["name"]


class TestGetProjectTemplateById:
    def test_get_project_template_by_id_success(self, test_client, mock_project_template):
        response = test_client.get(f"/project_templates/{mock_project_template.id}")
        assert response.status_code == 200
        assert response.json()["projectInfo"]["name"] == mock_project_template.name

    def test_get_project_template_by_id_not_found(self, test_client):
        response = test_client.get("/project_templates/1234")
        assert response.status_code == 404


class TestPatchProjectTemplate:
    def test_patch_project_template_success(self, test_client, mock_project_template):
        patch_data = {
            "projectInfo": {
                "name": "Updated Template",
                "description": "Updated Description"
            },
            "globalVars": [],
            "pages": []
        }
        response = test_client.put(f"/project_templates/{mock_project_template.id}", json=patch_data)
        assert response.status_code == 200
        assert response.json()["projectInfo"]["name"] == patch_data["projectInfo"]["name"]

    def test_patch_project_template_not_found(self, test_client):
        patch_data = {
            "projectInfo": {
                "name": "Updated Template",
                "description": "Updated Description"
            }
        }
        response = test_client.put("/project_templates/1234", json=patch_data)
        assert response.status_code == 404


class TestUpdateProjectTemplate:
    def test_update_project_template_success(self, test_client, mock_project_template):
        update_data = {
            "projectInfo": {
                "name": "Updated Template",
                "description": "Updated Description"
            },
            "globalVars": []
        }
        response = test_client.patch(f"/project_templates/{mock_project_template.id}", json=update_data)
        assert response.status_code == 200
        assert response.json()["projectInfo"]["name"] == update_data["projectInfo"]["name"]

    def test_update_project_template_not_found(self, test_client):
        update_data = {
            "projectInfo": {
                "name": "Updated Template"
            }
        }
        response = test_client.patch("/project_templates/1234", json=update_data)
        assert response.status_code == 404


class TestDeleteProjectTemplate:
    def test_delete_project_template_success(self, test_client, mock_project_template):
        response = test_client.delete(f"/project_templates/{mock_project_template.id}")
        assert response.status_code == 200
        assert response.json() == str(mock_project_template.id)

    def test_delete_project_template_not_found(self, test_client):
        response = test_client.delete("/project_templates/1234")
        assert response.status_code == 404


class TestCloneProjectTemplate:
    def test_clone_project_template_success(self, test_client, mock_project_template):
        clone_data = {
            "name": "Cloned Template",
            "description": "Cloned Description"
        }
        response = test_client.post(f"/project_templates/clone/{mock_project_template.id}", json=clone_data)
        assert response.status_code == 200
        assert response.json()["projectInfo"]["name"] == clone_data["name"]

    def test_clone_project_template_not_found(self, test_client):
        clone_data = {
            "name": "Cloned Template",
            "description": "Cloned Description"
        }
        response = test_client.post("/project_templates/clone/1234", json=clone_data)
        assert response.status_code == 404


class TestExportProjectTemplate:
    def test_export_project_template_success(self, test_client, mock_project_template):
        export_data = {
            "cid": "template_cid",
            "filename": "template.zip",
            "tags": ["tag1", "tag2"]
        }
        response = test_client.post(f"/project_templates/export/{mock_project_template.id}", json=export_data)
        assert response.status_code == 200
        assert response.headers["Content-Disposition"] == "attachment; filename=templates.zip"
        assert response.headers["Content-Type"] == "application/zip"

    def test_export_project_template_not_found(self, test_client):
        export_data = {
            "cid": "template_cid"
        }
        response = test_client.post(f"/project_templates/export/1234", json=export_data)
        assert response.status_code == 404

