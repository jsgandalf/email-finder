
trap killgroup SIGINT

killgroup() {
  echo killing...
  kill 0
}

for ((i=0;i<$2;i++))
do
  curl "$1" &
done

wait

