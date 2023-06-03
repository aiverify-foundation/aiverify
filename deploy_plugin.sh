#!/bin/bash

CURR_PATH=$(pwd)
# Frontend directories
FRONTEND_DIRECTORIES=(widgets inputs templates)

# Backend directories
ALGO_FOLDER=$CURR_PATH/algorithms
TEMP_DIR=temp

# Other configurations
PYTHON=python3
DEPLOY_FOLDER=$CURR_PATH/build
ALGO_DEPLOY_FOLDER=$CURR_PATH/build/algorithms
DIST_FOLDER=$CURR_PATH/dist
MAX_NO_OF_FILES=15


# Check if required libraries in the list required_libraries are installed. if not installed, prompt user to install them
required_libraries=(jq zip)

echo "Checking required libraries..."
for i in "${required_libraries[@]}";
do
    has_library=$(which "$i")    
    if [ -z "$has_library" ]
    then
        echo "$i is required. Please install this library and try again"
        require_installation=true
    fi
done

if [ "$require_installation" = true ];
then    
    exit 9999
fi

PLUGIN_VERSION=$(jq -r '.version' $CURR_PATH/plugin.meta.json)
PLUGIN_NAME=$(jq -r '.gid' $CURR_PATH/plugin.meta.json)

mkdir -p $DIST_FOLDER
rm -rf $DEPLOY_FOLDER ; mkdir $DEPLOY_FOLDER
rm -rf $ALGO_DEPLOY_FOLDER; mkdir $ALGO_DEPLOY_FOLDER

for FRONTEND_DIR in "${FRONTEND_DIRECTORIES[@]}";
do
if [ -d $CURR_PATH/$FRONTEND_DIR ]; then
  echo "copying $FRONTEND_DIR now"
  cp -r $CURR_PATH/$FRONTEND_DIR $DEPLOY_FOLDER
fi
done

cp plugin.meta.json $DEPLOY_FOLDER

cd $ALGO_FOLDER || exit
for ALGO_DIR in ./*;
    do
        echo "checking $ALGO_DIR now"
        echo "$ALGO_DIR"
        if [[ "$ALGO_DIR" == "./ci-central" ]]; then
            "skipping test folder"
            continue
        fi

        if [ -d $ALGO_DIR ]; then
            cd $ALGO_DIR
            PLUGIN_DIR=$(basename $(pwd))
            
            # Reset the no. of files that can be added to 0
            CURRENT_NO_OF_FILES=0

            # Check if there is any syntax error in the algo python file.
            # If there is, exit immediately as python file will not be able to run
            
            python3 syntax_checker.py $PLUGIN_DIR.py
            if [ $? != 0 ];
            then
                echo "Syntax check failed. Exiting now."
                exit 9999
            fi
            echo "Syntax check passed."
            
            if $PYTHON .; then
                if [ -d $TEMP_DIR ]
                then
                    rm -r $TEMP_DIR 
                fi
                mkdir -p $TEMP_DIR/$ALGO_DIR
                # Declare a string array that reads and stores list of required files from the <plugin name>.meta.json file 
                REQUIRED_FILES=$(jq -r '.requiredFiles | .[]' $PLUGIN_DIR.meta.json)

                # Copy required files (including user-defined files) into plugin folder
                for FILE_OR_FOLDER in ${REQUIRED_FILES}
                do
                    # If the number of files has already exceeded MAX_NO_OF_FILES, return error message saying there's too many files
                    if (( CURRENT_NO_OF_FILES >= MAX_NO_OF_FILES )); then
                            echo "Too many required files. Ensure that the total number of required files is less than $MAX_NO_OF_FILES. Remove some user-defined files and try to run this script again."
                            echo "Current number of files: $CURRENT_NO_OF_FILES"
                        exit 9999
                    fi

                    # If the number of discovered Python files in directory is more than MAX_NO_OF_FILES, return error message saying there's too many files
                    if [[ -d $FILE_OR_FOLDER ]]
                        then
                        NO_OF_PYTHON_FILES=$(find $FILE_OR_FOLDER -type f -name '*.py' | wc -l)
                        ((CURRENT_NO_OF_FILES+=$NO_OF_PYTHON_FILES))
                        if (( CURRENT_NO_OF_FILES >= MAX_NO_OF_FILES )); then
                            echo "Too many required files. Ensure that the total number of required files is less than $MAX_NO_OF_FILES. Remove some user-defined files and try to run this script again."
                            echo "Current total number of required files: $CURRENT_NO_OF_FILES"
                            exit 9999
                        fi

                        # If the traversed item is a file or directory. if it's a directory, recursively find all the python file(s) within and copy all the python file(s) to the temp directory
                        find $FILE_OR_FOLDER -type f -name "*.py" -exec cp --parents {} -t $TEMP_DIR/$ALGO_DIR \;
                        # find $FILE_OR_FOLDER -type f -name "*.py" -exec cp --parents {} -t $ALGO_DIR$TEMP_DIR/$ALGO_DIR \;
                        if [ $? -ne 0 ]
                            then
                            echo "Failed to copy $FILE_OR_FOLDER. Please ensure that the file or folder is present."
                            exit 9999
                        fi
                    else
                        # if it is not a directory, copy the file to the temp directory
                        cp $FILE_OR_FOLDER $TEMP_DIR/$ALGO_DIR
                        if [ $? -ne 0 ]
                            then
                            # Exit with failure
                            echo "Failed to copy file $FILE_OR_FOLDER. Please ensure that the file or folder is present."
                            exit 9999 # die with error code 9999
                        fi
                        ((CURRENT_NO_OF_FILES+=1))
                    fi
                done
                cp -r $TEMP_DIR/$ALGO_DIR $ALGO_DEPLOY_FOLDER
                rm -r $TEMP_DIR
                
            else
            # Exit with failure
            echo "Failed to run algo $ALGO_DIR."
            exit 9999 # die with error code 9999
            fi
            cd $ALGO_FOLDER || exit 
        fi
    done

cd $DEPLOY_FOLDER
zip -r $PLUGIN_NAME-$PLUGIN_VERSION.zip *
mv $PLUGIN_NAME-$PLUGIN_VERSION.zip $DIST_FOLDER
cd $CURR_PATH
rm -r $DEPLOY_FOLDER
# Exit successfully
echo "Completed successfully"
exit 0