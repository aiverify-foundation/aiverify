from test_engine_core.plugins.enums.model_type import ModelType
from accumulated_local_effect.algo_init import AlgoInit
import sys
import argparse


# Global variables
data_path = ''
model_path = ''
ground_truth_path = ''
ground_truth = ''
run_pipeline : bool = True
model_type = ''
core_modules_path = ''

def run():
    parse_input_args()
    print_user_input()
    invoke_accumulated_local_effect_plugin()

def parse_input_args():

    global data_path, model_path, ground_truth, ground_truth_path, run_pipeline, model_type

    parser = argparse.ArgumentParser(description='Process comma-separated arguments.')
    
    # Add a command-line argument that accepts a comma-separated string
    parser.add_argument('input', type=str, help='Comma-separated values')
    
    # Parse the arguments
    args = parser.parse_args()
    
    # Split the comma-separated string into a list
    args_list = args.input.split(',')
    

    data_path = args_list[0].strip()
    model_path = args_list[1].strip()
    ground_truth_path = args_list[2].strip()
    ground_truth = args_list[3].strip()

    if args_list[4].strip().lower() in ['true', '1', 'yes', 'y']:
        run_pipeline = True
    else:
        run_pipeline = False    

    try:
        model_type = ModelType[args_list[5].strip().upper()]
    except (ValueError, KeyError):
        print("Invalid selection. Please try again. ")
        exit
   
def print_user_input() :
    print("=" * 20)
    print('User Input ->')
    print(f"data_path: {data_path}")
    print(f"model_path: {model_path}")
    print(f"ground_truth_path: {ground_truth_path}")
    print(f"ground_truth: {ground_truth}")
    print(f"run_pipeline: {run_pipeline}")
    print(f"model_type: {model_type.name if model_type else 'Not selected'} \n")
    print("=" * 20)

def invoke_accumulated_local_effect_plugin():
    
    # =====================================================================================
    # NOTE: Do not modify the code below
    # =====================================================================================
    # Perform Plugin Testing
    try:
        # Create an instance of PluginInit with defined paths and arguments and Run.
        plugin_test = AlgoInit(
            run_pipeline,
            core_modules_path,
            data_path,
            model_path,
            ground_truth_path,
            ground_truth,
            model_type,
        )
        plugin_test.run()

    except Exception as exception:
        print(f"Exception caught while running the plugin test: {str(exception)}")

if __name__ == "__main__":
    run()
