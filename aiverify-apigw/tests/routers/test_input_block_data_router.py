import pytest
import json


class TestListInputBlockData:
    def test_list_input_block_data_success(self, test_client, mock_input_block_data):
        response = test_client.get("/input_block_data/")
        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["name"] == mock_input_block_data.name


class TestCreateInputBlockData:
    def test_create_input_block_data_success(self, test_client, mock_plugins):
        plugin = mock_plugins[0]
        ib = plugin.inputblocks[0]

        input_block_data = {
            "name": "test",
            "gid": plugin.gid,
            "cid": ib.cid,
            "group": None,
            "data": {"key": "value"}
        }
        response = test_client.post("/input_block_data/", json=input_block_data)
        assert response.status_code == 200
        assert response.json()["name"] == "test"

    def test_create_input_block_data_input_block_not_found(self, test_client):
        input_block_data = {
            "name": "test",
            "gid": "fake_gid1",
            "cid": "fake_cid1",
            "data": {"key": "value"}
        }
        response = test_client.post("/input_block_data/", json=input_block_data)
        assert response.status_code == 400


class TestReadInputBlockData:
    def test_read_input_block_data_success(self, test_client, mock_input_block_data):
        id = mock_input_block_data.id
        response = test_client.get(f"/input_block_data/{id}")
        assert response.status_code == 200
        assert response.json()["name"] == mock_input_block_data.name

    def test_read_input_block_data_not_found(self, test_client):
        response = test_client.get("/input_block_data/1234")
        assert response.status_code == 404
    

class TestUpdateInputBlockData:
    def test_update_input_block_data_success(self, test_client, mock_input_block_data):
        id = mock_input_block_data.id
        update_data = {
            "name": "updated_test",
            "data": {"key": "updated_value"}
        }
        response = test_client.put(f"/input_block_data/{id}", json=update_data)
        assert response.status_code == 200
        assert response.json()["name"] == "updated_test"

    def test_update_input_block_data_not_found(self, test_client):
        update_data = {
            "name": "updated_test",
            "data": {"key": "updated_value"}
        }
        response = test_client.put("/input_block_data/1234", json=update_data)
        assert response.status_code == 404


class TestDeleteInputBlockData:
    def test_delete_input_block_data_success(self, test_client, mock_input_block_data):
        id = mock_input_block_data.id
        response = test_client.delete(f"/input_block_data/{id}")
        assert response.status_code == 200
        assert response.json() == 1

    def test_delete_input_block_data_not_found(self, test_client):
        response = test_client.delete("/input_block_data/1234")
        assert response.status_code == 404


class TestCreateInputBlockGroupData:
    def test_create_input_block_group_data_success(self, test_client, mock_plugins):
        plugin = mock_plugins[0]
        ib_with_group = [block for block in plugin.inputblocks if block.group is not None]
        group = ib_with_group[0].group
        ib_input_list = [{"cid": ib.cid, "data": {"key": f"value-{ib.cid}"}, "groupNumber": ib.groupNumber} for ib in ib_with_group]

        input_block_group_data = {
            "name": "group_test",
            "gid": plugin.gid,
            "group": group,
            "input_blocks": ib_input_list
        }
        response = test_client.post("/input_block_data/groups", json=input_block_group_data)
        assert response.status_code == 200
        response_obj = response.json()
        response_obj["name"] == input_block_group_data["name"]
        response_obj["gid"] == input_block_group_data["gid"]
        response_obj["group"] == input_block_group_data["group"]
        assert len(response_obj["input_blocks"]) == len(ib_input_list)
        for ib in response_obj["input_blocks"]:
            ib_input = next((item for item in ib_input_list if item["cid"] == ib["cid"]), None)
            assert ib_input is not None
            assert ib["groupNumber"] == ib_input["groupNumber"]
            assert json.dumps(ib["data"]) == json.dumps(ib_input["data"])

    def test_create_input_block_group_data_plugin_not_found(self, test_client):
        # Mock the database query to return None
        input_block_group_data = {
            "name": "group_test",
            "gid": "fake_gid",
            "group": "group1",
            "input_blocks": [
                {"cid": "fake_cid", "data": {"key": "value"}}
            ]
        }
        response = test_client.post("/input_block_data/groups", json=input_block_group_data)
        assert response.status_code == 404


class TestReadInputBlockGroups:
    def test_read_input_block_groups_success(self, test_client, mock_input_block_group_data):
        # Mock the database query to return a list of InputBlockGroupDataModel instances
        response = test_client.get("/input_block_data/groups/")
        assert response.status_code == 200
        assert len(response.json()) == 1
        response_obj = response.json()[0]
        assert response_obj["name"] == mock_input_block_group_data.name
        assert len(response_obj["input_blocks"]) == len(mock_input_block_group_data.input_blocks)


class TestReadInputBlockGroupsByGidAndGroup:
    def test_read_input_block_groups_by_gid_and_group_success(self, test_client, mock_input_block_group_data):
        # Mock the database query to return a PluginModel instance
        response = test_client.get(f"/input_block_data/groups/{mock_input_block_group_data.gid}/{mock_input_block_group_data.group}")
        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["name"] == mock_input_block_group_data.name

    def test_read_input_block_groups_by_gid_and_group_plugin_not_found(self, test_client):
        response = test_client.get("/input_block_data/groups/fake_gid/fake_group")
        assert response.status_code == 404

    def test_read_input_block_groups_by_gid_and_group_no_groups_found(self, test_client, mock_plugins):
        plugin = mock_plugins[0]
        response = test_client.get(f"/input_block_data/groups/{plugin.gid}/fake_group")
        assert response.status_code == 200
        assert len(response.json()) == 0


class TestReadInputBlockGroup:
    def test_read_input_block_group_success(self, test_client, mock_input_block_group_data):
        response = test_client.get(f"/input_block_data/groups/{mock_input_block_group_data.id}")
        assert response.status_code == 200
        assert response.json()["name"] == mock_input_block_group_data.name

    def test_read_input_block_group_not_found(self, test_client):
        response = test_client.get("/input_block_data/groups/1234")
        assert response.status_code == 404


class TestUpdateInputBlockGroup:
    def test_update_input_block_group_success(self, test_client, mock_input_block_group_data):
        update_data = {
            "name": "updated_group_test",
            "input_blocks": [
                {"cid": ib_data.cid, "data": {"key": f"updated_{ib_data.cid}"}} for ib_data in mock_input_block_group_data.input_blocks
            ]
        }
        response = test_client.patch(f"/input_block_data/groups/{mock_input_block_group_data.id}", json=update_data)
        assert response.status_code == 200
        assert response.json()["name"] == update_data["name"]

    def test_update_input_block_group_not_found(self, test_client):
        update_data = {
            "name": "updated_group_test",
            "input_blocks": [
                {"cid": "cid1", "data": {"key": "updated_value"}}
            ]
        }
        response = test_client.patch("/input_block_data/groups/1234", json=update_data)
        assert response.status_code == 404


class TestDeleteInputBlockGroup:
    def test_delete_input_block_group_success(self, test_client, mock_input_block_group_data):
        response = test_client.delete(f"/input_block_data/groups/{mock_input_block_group_data.id}")
        assert response.status_code == 200

    def test_delete_input_block_group_not_found(self, test_client):
        response = test_client.delete("/input_block_data/groups/1234")
        assert response.status_code == 404
