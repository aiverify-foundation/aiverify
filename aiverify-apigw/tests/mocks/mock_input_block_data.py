from faker import Faker
from typing import List
import json
faker = Faker()
from aiverify_apigw.models import InputBlockDataModel, InputBlockGroupDataModel, InputBlockModel


def create_mock_input_block_data(session, inputblock: InputBlockModel):
    gid = inputblock.gid
    cid = inputblock.cid
    data = {"key": "value"}
    input_block_data = InputBlockDataModel(
        name=faker.name(),
        gid=gid,
        cid=cid,
        data=json.dumps(data).encode("utf-8"),
        inputblock=inputblock,
        created_at=faker.date_time_this_year(),
        updated_at=faker.date_time_this_year(),
    )
    session.add(input_block_data)
    session.flush()
    return input_block_data


def create_mock_input_block_group_data(session, inputblocks: List[InputBlockModel]):
    ib1 = inputblocks[0]
    gid = ib1.gid
    group = ib1.group

    input_block_data_list = []
    now = faker.date_time_this_year()
    for ib in inputblocks:
        # ib = session.merge(ib)
        # session.refresh(ib)
        ib_data = InputBlockDataModel(
            name=ib.cid,
            gid=gid,
            cid=ib.cid,
            # group=input_block_group_data,
            group_number=ib.groupNumber,
            data=json.dumps({"key": "value"}).encode("utf-8"),
            inputblock=ib,
        )
        input_block_data_list.append(ib_data)
    session.add_all(input_block_data_list)

    input_block_group_data = InputBlockGroupDataModel(
        gid=gid,
        name=faker.name(),
        group=group,
        input_blocks=input_block_data_list,
        created_at=now,
        updated_at=now,
    )
    session.add(input_block_group_data)
    session.flush()
    return input_block_group_data
