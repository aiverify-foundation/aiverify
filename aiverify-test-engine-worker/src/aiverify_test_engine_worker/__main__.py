from dotenv import load_dotenv
load_dotenv(override=True)

import json
from .lib.client import client, worker_id, init_group
from .lib.contants import TASK_STREAM_NAME, TASK_GROUP_NAME
from .lib.logging import logger
from .pipeline.pipeline import Pipeline
from .pipeline.schemas import TestRunTask, PipelineData


if __name__ == "__main__":
    logger.info(f"Running test engine worker {worker_id}")

    pipeline = Pipeline()

    init_group()
    try:
        while True:
            try:
                # Read from stream with consumer group
                messages = client.xreadgroup(
                    groupname=TASK_GROUP_NAME,
                    consumername=worker_id,
                    streams={TASK_STREAM_NAME: '>'},
                    count=1,
                    block=3000
                )

                if messages is None or len(messages) == 0:  # type: ignore
                    continue

                print(messages)

                # Process each message
                for stream, message_list in messages:  # type: ignore
                    for message_id, message_data in message_list:
                        try:
                            # Process the message data here
                            # ...
                            # logger.debug(f"Processing message {message_id}: {message_data}")
                            task_str: str = message_data[b'task'].decode("utf-8")
                            task_dict = json.loads(task_str)

                            task = TestRunTask(**task_dict)
                            logger.debug(f"Process task: {task}")
                            pipeline_data = PipelineData(task=task)
                            pipeline.run(pipeline_data)

                        except Exception as e:
                            logger.error(f"Error processing message {message_id}: {e}")
                            # Handle processing error, potentially move to dead letter queue
                        finally:
                            # Acknowledge message after processing
                            logger.debug(f"Send XACK for {message_id}")
                            client.xack(
                                TASK_STREAM_NAME,
                                TASK_GROUP_NAME,
                                message_id,
                            )

            except KeyboardInterrupt:
                logger.debug("Received interrupt signal, shutting down...")
                break
            except Exception as e:
                logger.error(f"Error in main loop: {e}")
                # Continue running after handling error

    finally:
        logger.info("Worker shutdown complete")
